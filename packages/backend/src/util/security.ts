import { argon2, randomBytes, timingSafeEqual, createHmac, createDecipheriv } from "node:crypto";

const VERSION = 1;
const SALT_LENGTH = 16;
const TAG_LENGTH = 32;

const MEMORY = 64 * 1024;
const PASSES = 3;
const PARALLELISM = 4;

export const hashPassword = async (password: string): Promise<Buffer> => {
     const nonce = randomBytes(SALT_LENGTH);

     return new Promise((resolve, reject) => {
          argon2("argon2id",
               {
                    message: password,
                    nonce,
                    memory: MEMORY,
                    passes: PASSES,
                    parallelism: PARALLELISM,
                    tagLength: TAG_LENGTH
               }, (err, derivedKey) => {
                    if (err) {
                         reject(err);
                         return;
                    }

                    const result = Buffer.alloc(9 + nonce.length + derivedKey.length);

                    let offset = 0;

                    result.writeUInt8(VERSION, offset++);
                    result.writeUInt32BE(MEMORY, offset);
                    offset += 4;
                    result.writeUInt8(PASSES, offset++);
                    result.writeUInt8(PARALLELISM, offset++);
                    result.writeUInt8(nonce.length, offset++);
                    nonce.copy(result, offset);
                    offset += nonce.length;
                    result.writeUInt8(derivedKey.length, offset++);
                    derivedKey.copy(result, offset);

                    resolve(result);
               });
     });
};

export const verifyPassword = async (password: string, stored: Buffer): Promise<boolean> => {
     try {
          let offset = 0;

          const version = stored.readUInt8(offset++);
          if (version !== VERSION) {return Promise.resolve(false);}

          const memory = stored.readUInt32BE(offset);
          offset += 4;

          const passes = stored.readUInt8(offset++);
          const parallelism = stored.readUInt8(offset++);

          const saltLength = stored.readUInt8(offset++);
          if (saltLength < 16 || offset + saltLength > stored.length) {return Promise.resolve(false);}

          const nonce = stored.subarray(offset, offset + saltLength);
          offset += saltLength;

          const tagLength = stored.readUInt8(offset++);

          if (tagLength === 0 || offset + tagLength !== stored.length) {
               return Promise.resolve(false);
          }

          const expected = stored.subarray(offset);

          return new Promise((resolve, reject) => {
               argon2("argon2id", {
                    message: password,
                    nonce,
                    memory,
                    passes,
                    parallelism,
                    tagLength
               }, (err, derivedKey) => {
                    if (err) {
                         reject(err);
                         return;
                    }

                    resolve(derivedKey.length === expected.length &&
                         timingSafeEqual(derivedKey, expected));
               });
          });
     } catch {
          return Promise.resolve(false);
     }
};

const TOTP_IV_LENGTH = 12;
const TOTP_TAG_LENGTH = 16;

const encryptionKeyCache = new Map<string, Buffer>();

const getEncryptionKey = (kmsKeyIdentifier: string): Buffer => {
     const cached = encryptionKeyCache.get(kmsKeyIdentifier);
     if (cached) {return cached;}

     const envValue = process.env[kmsKeyIdentifier];
     if (!envValue) {
          throw new Error(`missing encryption key for identifier ${kmsKeyIdentifier}`);
     }

     const key = Buffer.from(envValue, "base64");
     if (key.length !== 32) {
          throw new Error(`encryption key for identifier ${kmsKeyIdentifier} must be 32 bytes`);
     }

     encryptionKeyCache.set(kmsKeyIdentifier, key);
     return key;
};

const decryptTotpSecret = (encryptedSecret: Buffer, kmsKeyIdentifier: string): Buffer => {
     const key = getEncryptionKey(kmsKeyIdentifier);

     const iv = encryptedSecret.subarray(0, TOTP_IV_LENGTH);
     const tag = encryptedSecret.subarray(TOTP_IV_LENGTH, TOTP_IV_LENGTH + TOTP_TAG_LENGTH);
     const ciphertext = encryptedSecret.subarray(TOTP_IV_LENGTH + TOTP_TAG_LENGTH);

     const decipher = createDecipheriv("aes-256-gcm", key, iv);
     decipher.setAuthTag(tag);

     return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

const base32digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const decodeBase32 = (value: string): Buffer => {
     const cleaned = value.toUpperCase().replace(/[^A-Z2-7]/g, "");

     let bits = 0;
     let bitCount = 0;
     const bytes: number[] = [];

     for (const character of cleaned) {
          const index = base32digits.indexOf(character);
          if (index === -1) {continue;}

          bits = (bits << 5) | index;
          bitCount += 5;

          if (bitCount >= 8) {
               bitCount -= 8;
               bytes.push((bits >> bitCount) & 0xff);
          }
     }

     return Buffer.from(bytes);
};

export type TotpAlgorithm = "SHA1" | "SHA256" | "SHA512";

const totpAlgorithmToHmacAlgorithm: Record<TotpAlgorithm, string> = {
     SHA1: "sha1",
     SHA256: "sha256",
     SHA512: "sha512"
};

const computeTotpCode = (secret: Buffer, algorithm: TotpAlgorithm, digits: number, counter: bigint): string => {
     const counterBuffer = Buffer.alloc(8);
     counterBuffer.writeBigUInt64BE(counter);

     const hmac = createHmac(totpAlgorithmToHmacAlgorithm[algorithm], secret).update(counterBuffer).digest();

     const offset = hmac[hmac.length - 1]! & 0x0f;
     const truncated =
          ((hmac[offset]! & 0x7f) << 24) |
          ((hmac[offset + 1]! & 0xff) << 16) |
          ((hmac[offset + 2]! & 0xff) << 8) |
          (hmac[offset + 3]! & 0xff);

     const code = (truncated % 10 ** digits).toString().padStart(digits, "0");
     return code;
};

export const verifyTotpCode = async (code: string, encryptedSecret: Buffer, kmsKeyIdentifier: string, digits: number, periodSeconds: number, algorithm: TotpAlgorithm = "SHA1", windowSteps: number = 1): Promise<boolean> => {
     try {
          if (!/^\d+$/.test(code) || code.length !== digits) {return false;}

          const decrypted = decryptTotpSecret(encryptedSecret, kmsKeyIdentifier);
          const secret = decrypted.length % 5 === 0 && /^[A-Z2-7]+$/i.test(decrypted.toString("ascii"))
               ? decodeBase32(decrypted.toString("ascii"))
               : decrypted;

          const currentCounter = BigInt(Math.floor(Date.now() / 1000 / periodSeconds));

          for (let step = -windowSteps; step <= windowSteps; step++) {
               const candidateCounter = currentCounter + BigInt(step);
               if (candidateCounter < 0n) {continue;}

               const expectedCode = computeTotpCode(secret, algorithm, digits, candidateCounter);
               if (expectedCode.length === code.length && timingSafeEqual(Buffer.from(expectedCode), Buffer.from(code))) {return true;}
          }

          return false;
     } catch {
          return false;
     }
};