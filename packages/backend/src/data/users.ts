import type { PoolConnection } from "mariadb";
import { getPool, type InsertRow } from "./db.js";
import { randomUUIDv7, randomBytes, createHash } from "node:crypto";
import { hashPassword, verifyPassword, verifyTotpCode } from "../util/security.js";

export type IdentityType = "username" | "email" | "phone";

type UserStatusCode = "pending" | "active" | "disabled" | "locked" | "deleted";
type UserStatus = {
     user_status_id: number;
     status_code: UserStatusCode;
};
type UserIdentifierCode = "username" | "email" | "phone";
type UserIdentifier = {
     identifier_type_id: number;
     type_code: UserIdentifierCode;
};
type AuthMethodCode = "password" | "webauthn" | "totp" | "oauth_google" | "recovery_code";
type AuthMethod = {
     auth_method_id: number;
     method_code: AuthMethodCode;
     auth_method_category_id: number;
};
type AuthMethodCategoryCode = "primary" | "second_factor" | "recovery";
type AuthMethodCategory = {
     auth_method_category_id: number;
     category_code: AuthMethodCategoryCode;
};
type AuthStatusCode = "active" | "disabled" | "revoked";
type AuthStatus = {
     user_auth_method_status_id: number;
     status_code: AuthStatusCode;
};
type LoginAttemptStatusCode = "pending" | "mfa_pending" | "completed" | "failed" | "expired" | "cancelled";
type LoginAttemptStatus = {
     login_attempt_status_id: number;
     status_code: LoginAttemptStatusCode;
};
type LoginAttemptStepStatusCode = "pending" | "succeeded" | "failed";
type LoginAttemptStepStatus = {
     login_attempt_step_status_id: number;
     status_code: LoginAttemptStepStatusCode;
};
type SessionStatusCode = "active" | "revoked" | "expired";
type SessionStatus = {
     session_status_id: number;
     status_code: SessionStatusCode;
};
type RefreshTokenStatusCode = "active" | "rotated" | "revoked" | "reuse_detected";
type RefreshTokenStatus = {
     refresh_token_status_id: number;
     status_code: RefreshTokenStatusCode;
};

export const authMethodDisplayNames: Record<AuthMethodCode, string> = {
     password: "Password",
     webauthn: "Passkey / Security Key",
     totp: "Authenticator App (TOTP)",
     oauth_google: "Google Sign-In",
     recovery_code: "Recovery Code"
};

const newPublicId = (): string => randomUUIDv7().replace(/-/g, "");

const TTLLoginAttempt = 600;
const TTLIdle = 60 * 60 * 24 * 30;
const TTLSession = 60 * 60 * 24 * 90;
const TTLSessionToken = 60 * 15;
const TTLRefreshToken = 60 * 60 * 24 * 30;
const RefreshTokenRotationDelay = 10;

const getUserStatuses = async (connection: PoolConnection): Promise<Map<UserStatusCode, number>> => {
     const raw = await connection.query<UserStatus[]>("select user_status_id, status_code from user_statuses");
     return new Map(raw.map((value) => [value.status_code, value.user_status_id]));
};
const getIdentifiers = async (connection: PoolConnection): Promise<Map<UserIdentifierCode, number>> => {
     const raw = await connection.query<UserIdentifier[]>("select identifier_type_id, type_code from identifier_types");
     return new Map(raw.map((value) => [value.type_code, value.identifier_type_id]));
};
const getAuthMethods = async (connection: PoolConnection): Promise<Map<AuthMethodCode, AuthMethod>> => {
     const raw = await connection.query<AuthMethod[]>("select auth_method_id, method_code, auth_method_category_id from auth_methods");
     return new Map(raw.map((value) => [value.method_code, value]));
};
const getAuthMethodCategories = async (connection: PoolConnection): Promise<Map<AuthMethodCategoryCode, number>> => {
     const raw = await connection.query<AuthMethodCategory[]>("select auth_method_category_id, category_code from auth_method_categories");
     return new Map(raw.map((value) => [value.category_code, value.auth_method_category_id]));
};
const getAuthStatuses = async (connection: PoolConnection): Promise<Map<AuthStatusCode, number>> => {
     const raw = await connection.query<AuthStatus[]>("select user_auth_method_status_id, status_code from user_auth_method_statuses");
     return new Map(raw.map((value) => [value.status_code, value.user_auth_method_status_id]));
};
const getLoginAttemptStatuses = async (connection: PoolConnection): Promise<Map<LoginAttemptStatusCode, number>> => {
     const raw = await connection.query<LoginAttemptStatus[]>("select login_attempt_status_id, status_code from login_attempt_statuses");
     return new Map(raw.map((value) => [value.status_code, value.login_attempt_status_id]));
};
const getLoginAttemptStepStatuses = async (connection: PoolConnection): Promise<Map<LoginAttemptStepStatusCode, number>> => {
     const raw = await connection.query<LoginAttemptStepStatus[]>("select login_attempt_step_status_id, status_code from login_attempt_step_statuses");
     return new Map(raw.map((value) => [value.status_code, value.login_attempt_step_status_id]));
};
const getSessionStatuses = async (connection: PoolConnection): Promise<Map<SessionStatusCode, number>> => {
     const raw = await connection.query<SessionStatus[]>("select session_status_id, status_code from session_statuses");
     return new Map(raw.map((value) => [value.status_code, value.session_status_id]));
};
const getRefreshTokenStatuses = async (connection: PoolConnection): Promise<Map<RefreshTokenStatusCode, number>> => {
     const raw = await connection.query<RefreshTokenStatus[]>("select refresh_token_status_id, status_code from refresh_token_statuses");
     return new Map(raw.map((value) => [value.status_code, value.refresh_token_status_id]));
};

const sha256Hex = (value: string): Buffer => createHash("sha256").update(value).digest();
const generateOpaqueToken = (): string => randomBytes(32).toString("base64url");

export type RegisterResult = {
     userId: number;
     userPublicId: string;
} | null;

export const registerUser = async (identity: string, identityType: IdentityType, password: string): Promise<RegisterResult> => {
     const hashedPassword = await hashPassword(password);

     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();
          const statuses = await getUserStatuses(connection);
          const identifiers = await getIdentifiers(connection);
          const authMethods = await getAuthMethods(connection);
          const authStatuses = await getAuthStatuses(connection);

          const publicId = newPublicId();
          const { insertId: userID } = await connection.query<InsertRow>("insert into users (public_id, user_status_id) values (UNHEX(REPLACE(?, \"-\", \"\")), ?);", [publicId, statuses.get("active")]);
          await connection.query("insert into user_login_identifiers (user_id, identifier_type_id, identifier_value, is_primary) values (?, ?, ?, 1);", [userID, identifiers.get(identityType), identity]);
          const { insertId: authMethodId } = await connection.query<InsertRow>("insert into user_auth_methods (user_id, auth_method_id, user_auth_method_status_id, is_primary) values (?, ?, ?, 1);", [userID, authMethods.get("password")?.auth_method_id, authStatuses.get("active")]);
          await connection.query("insert into password_credentials (user_id, user_auth_method_id, argon2id_hash) values (?, ?, ?);", [userID, authMethodId, hashedPassword]);

          await connection.commit();
          return { userId: Number(userID), userPublicId: publicId };
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return null;
     } finally {
          if (connection) { connection.release(); }
     }
};

export const createSessionAfterRegistration = async (userId: number, deviceToken: string | null): Promise<SessionTokens | null> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();

          const deviceId = await findOrCreateDeviceForUser(connection, userId, deviceToken);
          const tokens = await createSessionForUser(connection, userId, deviceId);

          await connection.commit();
          return tokens;
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return null;
     } finally {
          if (connection) { connection.release(); }
     }
};

export type LoginSessionResult = {
     loginAttemptPublicId: string;
     status: LoginAttemptStatusCode;
     requiredAuthMethod: AuthMethodCode | null;
     userFound: boolean;
};

export const cleanupExpiredLoginAttempts = async (): Promise<void> => {
     const connection = await getPool().getConnection();
     try {
          await connection.query("delete from login_attempt_steps where login_attempt_id in (select login_attempt_id from login_attempts where expires_at < DATE_SUB(NOW(6), INTERVAL 1 DAY));");
          await connection.query("delete from login_attempts where expires_at < DATE_SUB(NOW(6), INTERVAL 1 DAY);");
     } finally {
          connection.release();
     }
};

export const startLoginSession = async (identity: string, identityType: IdentityType, idempotencyKey: string): Promise<LoginSessionResult> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();

          await connection.query("delete from login_attempt_steps where login_attempt_id in (select login_attempt_id from login_attempts where expires_at < DATE_SUB(NOW(6), INTERVAL 1 DAY));");
          await connection.query("delete from login_attempts where expires_at < DATE_SUB(NOW(6), INTERVAL 1 DAY);");

          const nonceHash = sha256Hex(idempotencyKey);
          const identifiers = await getIdentifiers(connection);
          const authMethods = await getAuthMethods(connection);
          const authMethodCategories = await getAuthMethodCategories(connection);
          const loginAttemptStatuses = await getLoginAttemptStatuses(connection);
          const loginAttemptStepStatuses = await getLoginAttemptStepStatuses(connection);

          const statusIdToCode = new Map(Array.from(loginAttemptStatuses.entries()).map(([code, id]) => [id, code]));
          const methodIdToCode = new Map(Array.from(authMethods.values()).map((method) => [method.auth_method_id, method.method_code]));

          const existingRows = await connection.query<{ login_attempt_id: number; public_id: Buffer; login_attempt_status_id: number; current_auth_method_id: number | null; expires_at: Date }[]>("select login_attempt_id, public_id, login_attempt_status_id, current_auth_method_id, expires_at from login_attempts where nonce_hash = ? limit 1 for update;",
               [nonceHash]);

          if (existingRows.length > 0) {
               const existing = existingRows[0]!;
               const existingStatus = statusIdToCode.get(existing.login_attempt_status_id) ?? "failed";
               const stillLive = existingStatus === "pending" || existingStatus === "mfa_pending";

               if (stillLive && existing.expires_at.getTime() > Date.now()) {
                    await connection.commit();
                    return {
                         loginAttemptPublicId: existing.public_id.toString("hex"),
                         status: existingStatus,
                         requiredAuthMethod: existing.current_auth_method_id ? (methodIdToCode.get(existing.current_auth_method_id) ?? null) : null,
                         userFound: true
                    };
               }
          }

          const existingId = existingRows.length > 0 ? existingRows[0]!.login_attempt_id : null;
          const publicId = existingRows.length > 0 ? existingRows[0]!.public_id.toString("hex") : newPublicId();

          const userRows = await connection.query<{ user_id: number }[]>("select user_id from user_login_identifiers where identifier_type_id = ? and identifier_value = ? and retired_at is null limit 1;",
               [identifiers.get(identityType), identity]);

          const upsertAttempt = async (userId: number | null, statusCode: "failed" | "pending", currentAuthMethodId: number | null) => {
               if (existingId !== null) {
                    await connection!.query("update login_attempts set user_id = ?, login_attempt_status_id = ?, current_auth_method_id = ?, expires_at = DATE_ADD(NOW(6), INTERVAL ? SECOND), completed_at = NULL where login_attempt_id = ?;",
                         [userId, loginAttemptStatuses.get(statusCode), currentAuthMethodId, TTLLoginAttempt, existingId]);
                    return existingId;
               }
               const { insertId } = await connection!.query<InsertRow>("insert into login_attempts (public_id, nonce_hash, user_id, login_attempt_status_id, current_auth_method_id, expires_at) values (UNHEX(?), ?, ?, ?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND));",
                    [publicId, nonceHash, userId, loginAttemptStatuses.get(statusCode), currentAuthMethodId, TTLLoginAttempt]);
               return Number(insertId);
          };

          if (userRows.length === 0) {
               await upsertAttempt(null, "failed", null);
               await connection.commit();
               return { loginAttemptPublicId: publicId, status: "failed", requiredAuthMethod: null, userFound: false };
          }

          const userId = userRows[0]!.user_id;
          const primaryCategoryId = authMethodCategories.get("primary");
          const enrolledPrimaryMethods = await connection.query<{ auth_method_id: number }[]>("select user_auth_methods.auth_method_id from user_auth_methods inner join user_auth_method_statuses on user_auth_method_statuses.user_auth_method_status_id = user_auth_methods.user_auth_method_status_id inner join auth_methods on auth_methods.auth_method_id = user_auth_methods.auth_method_id where user_auth_methods.user_id = ? and auth_methods.auth_method_category_id = ? and user_auth_method_statuses.status_code = 'active' order by user_auth_methods.is_primary desc limit 1;",
               [userId, primaryCategoryId]);

          if (enrolledPrimaryMethods.length === 0) {
               await upsertAttempt(userId, "failed", null);
               await connection.commit();
               return { loginAttemptPublicId: publicId, status: "failed", requiredAuthMethod: null, userFound: true };
          }

          const currentAuthMethodId = enrolledPrimaryMethods[0]!.auth_method_id;
          const loginAttemptId = await upsertAttempt(userId, "pending", currentAuthMethodId);

          await connection.query("insert into login_attempt_steps (login_attempt_id, auth_method_id, login_attempt_step_status_id) values (?, ?, ?);",
               [loginAttemptId, currentAuthMethodId, loginAttemptStepStatuses.get("pending")]);

          await connection.commit();
          return {
               loginAttemptPublicId: publicId,
               status: "pending",
               requiredAuthMethod: methodIdToCode.get(currentAuthMethodId) ?? null,
               userFound: true
          };
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return { loginAttemptPublicId: "", status: "failed", requiredAuthMethod: null, userFound: false };
     } finally {
          if (connection) { connection.release(); }
     }
};

export type LoginCredential =
     | { method: "password"; password: string }
     | { method: "totp"; code: string }
     | { method: "recovery_code"; code: string };

export type SessionTokens = {
     sessionPublicId: string;
     sessionToken: string;
     refreshToken?: string;
     idleExpiresAt: Date;
     absoluteExpiresAt: Date;
};

export type ContinueLoginResult =
     | { status: "failed" }
     | { status: "expired" }
     | { status: "mfa_pending"; requiredAuthMethod: AuthMethodCode }
     | { status: "completed"; tokens: SessionTokens };

const createSessionForUser = async (connection: PoolConnection, userId: number, deviceId: number): Promise<SessionTokens> => {
     const sessionStatuses = await getSessionStatuses(connection);
     const refreshTokenStatuses = await getRefreshTokenStatuses(connection);

     const sessionPublicId = newPublicId();
     const { insertId: sessionId } = await connection.query<InsertRow>("insert into sessions (public_id, user_id, device_id, session_status_id, idle_expires_at, absolute_expires_at) values (UNHEX(REPLACE(?, \"-\", \"\")), ?, ?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND), DATE_ADD(NOW(6), INTERVAL ? SECOND));",
          [sessionPublicId, userId, deviceId, sessionStatuses.get("active"), TTLIdle, TTLSession]);

     const sessionToken = generateOpaqueToken();
     const { insertId: sessionTokenId } = await connection.query<InsertRow>("insert into session_tokens (session_id, token_hash, expires_at) values (?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND));",
          [sessionId, sha256Hex(sessionToken), TTLSessionToken]);

     const refreshToken = generateOpaqueToken();
     await connection.query("insert into refresh_tokens (session_id, session_token_id, token_family_id, token_hash, refresh_token_status_id, expires_at) values (?, ?, UNHEX(REPLACE(?, \"-\", \"\")), ?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND));",
          [sessionId, sessionTokenId, newPublicId(), sha256Hex(refreshToken), refreshTokenStatuses.get("active"), TTLRefreshToken]);

     const sessionRows = await connection.query<{ idle_expires_at: Date; absolute_expires_at: Date }[]>("select idle_expires_at, absolute_expires_at from sessions where session_id = ?;",
          [sessionId]);

     return {
          sessionPublicId,
          sessionToken,
          refreshToken,
          idleExpiresAt: sessionRows[0]!.idle_expires_at,
          absoluteExpiresAt: sessionRows[0]!.absolute_expires_at
     };
};

const findOrCreateDeviceForUser = async (connection: PoolConnection, userId: number, deviceToken: string | null): Promise<number> => {
     if (deviceToken !== null) {
          const existing = await connection.query<{ device_id: number }[]>("select device_id from devices where device_token_hash = ? and revoked_at is null limit 1;",
               [sha256Hex(deviceToken)]);
          if (existing.length > 0) {
               await connection.query("update devices set user_id = ?, last_seen_at = NOW(6) where device_id = ?;", [userId, existing[0]!.device_id]);
               return existing[0]!.device_id;
          }
     }

     const publicId = newPublicId();
     const generatedToken = deviceToken ?? generateOpaqueToken();
     const { insertId: deviceId } = await connection.query<InsertRow>("insert into devices (public_id, user_id, device_token_hash) values (UNHEX(REPLACE(?, \"-\", \"\")), ?, ?);",
          [publicId, userId, sha256Hex(generatedToken)]);
     return deviceId;
};

export const continueLoginSession = async (loginAttemptPublicId: string, credential: LoginCredential, deviceToken: string | null): Promise<ContinueLoginResult> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();

          const authMethods = await getAuthMethods(connection);
          const authMethodCategories = await getAuthMethodCategories(connection);
          const authStatuses = await getAuthStatuses(connection);
          const loginAttemptStatuses = await getLoginAttemptStatuses(connection);
          const loginAttemptStepStatuses = await getLoginAttemptStepStatuses(connection);
          const methodIdToCode = new Map(Array.from(authMethods.values()).map((method) => [method.auth_method_id, method.method_code]));

          const attemptRows = await connection.query<{ login_attempt_id: number; user_id: number | null; login_attempt_status_id: number; current_auth_method_id: number | null; expires_at: Date }[]>("select login_attempt_id, user_id, login_attempt_status_id, current_auth_method_id, expires_at from login_attempts where public_id = UNHEX(?) limit 1 for update;",
               [loginAttemptPublicId]);

          if (attemptRows.length === 0) {
               await connection.rollback();
               return { status: "failed" };
          }

          const attempt = attemptRows[0]!;

          if (attempt.expires_at.getTime() <= Date.now()) {
               await connection.query("update login_attempts set login_attempt_status_id = ? where login_attempt_id = ?;", [loginAttemptStatuses.get("expired"), attempt.login_attempt_id]);
               await connection.commit();
               return { status: "expired" };
          }

          if (attempt.user_id === null || attempt.current_auth_method_id === null) {
               await connection.rollback();
               return { status: "failed" };
          }

          const expectedMethodCode = methodIdToCode.get(attempt.current_auth_method_id);
          if (expectedMethodCode !== credential.method) {
               await connection.rollback();
               return { status: "failed" };
          }

          const userId = attempt.user_id;
          let credentialValid = false;

          if (credential.method === "password") {
               const passwordRows = await connection.query<{ argon2id_hash: Buffer }[]>("select password_credentials.argon2id_hash from password_credentials inner join user_auth_methods on user_auth_methods.user_auth_method_id = password_credentials.user_auth_method_id where password_credentials.user_id = ? and user_auth_methods.user_auth_method_status_id = ? limit 1;",
                    [userId, authStatuses.get("active")]);
               credentialValid = passwordRows.length > 0 && (await verifyPassword(credential.password, passwordRows[0]!.argon2id_hash));
          } else if (credential.method === "totp") {
               const totpRows = await connection.query<{ totp_credential_id: number; encrypted_secret: Buffer; kms_key_identifier: string; digits: number; period_seconds: number }[]>("select totp_credential_id, encrypted_secret, kms_key_identifier, digits, period_seconds from totp_credentials where user_id = ? and credential_status_id = (select credential_status_id from credential_statuses where status_code = 'active') limit 1;",
                    [userId]);
               if (totpRows.length > 0) {
                    credentialValid = await verifyTotpCode(credential.code, totpRows[0]!.encrypted_secret, totpRows[0]!.kms_key_identifier, totpRows[0]!.digits, totpRows[0]!.period_seconds);
                    if (credentialValid) {
                         await connection.query("update totp_credentials set last_used_at = NOW(6) where totp_credential_id = ?;", [totpRows[0]!.totp_credential_id]);
                    }
               }
          } else if (credential.method === "recovery_code") {
               const codeHash = sha256Hex(credential.code);
               const recoveryRows = await connection.query<{ recovery_code_id: number }[]>("select recovery_code_id from recovery_codes where user_id = ? and code_hash = ? and used_at is null limit 1;",
                    [userId, codeHash]);
               if (recoveryRows.length > 0) {
                    credentialValid = true;
                    await connection.query("update recovery_codes set used_at = NOW(6) where recovery_code_id = ?;", [recoveryRows[0]!.recovery_code_id]);
               }
          }

          const stepStatus = credentialValid ? "succeeded" : "failed";
          await connection.query("update login_attempt_steps set login_attempt_step_status_id = ?, completed_at = NOW(6) where login_attempt_id = ? and auth_method_id = ? order by login_attempt_step_id desc limit 1;",
               [loginAttemptStepStatuses.get(stepStatus), attempt.login_attempt_id, attempt.current_auth_method_id]);

          if (!credentialValid) {
               await connection.commit();
               return { status: "failed" };
          }

          const policyRows = await connection.query<{ mfa_required: boolean | null }[]>("select mfa_required from user_auth_policies where user_id = ?;",
               [userId]);
          const globalPolicyRows = await connection.query<{ mfa_required_by_default: boolean }[]>("select mfa_required_by_default from global_auth_policy where global_auth_policy_id = 1;");
          const mfaRequired = policyRows.length > 0 && policyRows[0]!.mfa_required !== null ? Boolean(policyRows[0]!.mfa_required) : Boolean(globalPolicyRows[0]?.mfa_required_by_default);

          const usedPrimary = authMethodCategories.get("primary") === authMethods.get(expectedMethodCode)?.auth_method_category_id;

          if (mfaRequired && usedPrimary) {
               const secondFactorCategoryId = authMethodCategories.get("second_factor");
               const enrolledSecondFactors = await connection.query<{ auth_method_id: number }[]>("select user_auth_methods.auth_method_id from user_auth_methods inner join user_auth_method_statuses on user_auth_method_statuses.user_auth_method_status_id = user_auth_methods.user_auth_method_status_id inner join auth_methods on auth_methods.auth_method_id = user_auth_methods.auth_method_id where user_auth_methods.user_id = ? and auth_methods.auth_method_category_id = ? and user_auth_method_statuses.status_code = 'active' limit 1;",
                    [userId, secondFactorCategoryId]);

               if (enrolledSecondFactors.length > 0) {
                    const nextMethodId = enrolledSecondFactors[0]!.auth_method_id;
                    await connection.query("update login_attempts set login_attempt_status_id = ?, current_auth_method_id = ? where login_attempt_id = ?;",
                         [loginAttemptStatuses.get("mfa_pending"), nextMethodId, attempt.login_attempt_id]);
                    await connection.query("insert into login_attempt_steps (login_attempt_id, auth_method_id, login_attempt_step_status_id) values (?, ?, ?);",
                         [attempt.login_attempt_id, nextMethodId, loginAttemptStepStatuses.get("pending")]);
                    await connection.commit();
                    return { status: "mfa_pending", requiredAuthMethod: methodIdToCode.get(nextMethodId)! };
               }
          }

          const deviceId = await findOrCreateDeviceForUser(connection, userId, deviceToken);
          const tokens = await createSessionForUser(connection, userId, deviceId);

          await connection.query("delete from login_attempts where login_attempt_id = ?;", [attempt.login_attempt_id]);

          await connection.commit();
          return { status: "completed", tokens };
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return { status: "failed" };
     } finally {
          if (connection) { connection.release(); }
     }
};

export type SelfInfo = {
     userPublicId: string;
     status: UserStatusCode;
     createdAt: Date;
     identifiers: { type: UserIdentifierCode; value: string; isPrimary: boolean }[];
};

export const getSession = async (sessionToken: string, connection: PoolConnection): Promise<{
     user_id: number;
     session_id: bigint;
} | null> => {
     const sessionRows = await connection.query<{ user_id: number; session_id: bigint }[]>("select sessions.user_id, sessions.session_id from session_tokens inner join sessions on sessions.session_id = session_tokens.session_id inner join session_statuses on session_statuses.session_status_id = sessions.session_status_id where session_tokens.token_hash = ? and session_tokens.revoked_at is null and session_tokens.expires_at > NOW(6) and session_statuses.status_code = 'active' and sessions.idle_expires_at > NOW(6) and sessions.absolute_expires_at > NOW(6) limit 1;",
          [sha256Hex(sessionToken)]);

     if (sessionRows.length === 0) {
          return null;
     }

     return sessionRows[0]!;
};
type GetRequirement<T> = {
     value: T;
     policy: "user" | "inherited";
};

const checkIfMFAIsRequired = async (connection: PoolConnection, userId: number): Promise<GetRequirement<boolean>> => {
     const policyRows = await connection.query<{ mfa_required: boolean | null }[]>("select mfa_required from user_auth_policies where user_id = ?;",
          [userId]);
     const globalPolicyRows = await connection.query<{ mfa_required_by_default: boolean }[]>("select mfa_required_by_default from global_auth_policy where global_auth_policy_id = 1;");
     const wasUserOverride = policyRows.length > 0 && policyRows[0]!.mfa_required !== null;
     const mfaRequired = wasUserOverride ? Boolean(policyRows[0]!.mfa_required) : Boolean(globalPolicyRows[0]?.mfa_required_by_default);
     return {
          value: mfaRequired,
          policy: wasUserOverride ? "user" : "inherited"
     };
};
type UserConfiguration = {
     mfa: GetRequirement<boolean>;
};
export const getUserConfiguration = async (sessionToken: string): Promise<UserConfiguration | null> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          const session = await getSession(sessionToken, connection);
          if (!session) return null;
          const userId = session.user_id;
          const buildConfig: UserConfiguration = {
               mfa: await checkIfMFAIsRequired(connection, userId)
          };
          return buildConfig;
     } catch (error) {
          console.error(error); // todo: audit log?
          return null;
     } finally {
          if (connection) { connection.release(); }
     }
};

export const getSelfInfo = async (sessionToken: string): Promise<SelfInfo | null> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();

          const session = await getSession(sessionToken, connection);
          if (!session) return null;
          const userId = session.user_id;

          const userRows = await connection.query<{ public_id: Buffer; created_at: Date; status_code: UserStatusCode }[]>("select users.public_id, users.created_at, user_statuses.status_code from users inner join user_statuses on user_statuses.user_status_id = users.user_status_id where users.user_id = ? limit 1;",
               [userId]);

          if (userRows.length === 0) {
               return null;
          }

          const identifierRows = await connection.query<{ type_code: UserIdentifierCode; identifier_value: string; is_primary: number }[]>("select identifier_types.type_code, user_login_identifiers.identifier_value, user_login_identifiers.is_primary from user_login_identifiers inner join identifier_types on identifier_types.identifier_type_id = user_login_identifiers.identifier_type_id where user_login_identifiers.user_id = ? and user_login_identifiers.retired_at is null;",
               [userId]);

          await connection.query("update session_tokens set last_used_at = NOW(6) where token_hash = ?;", [sha256Hex(sessionToken)]);
          await connection.query("update sessions set last_used_at = NOW(6), idle_expires_at = DATE_ADD(NOW(6), INTERVAL ? SECOND) where session_id = ?;", [TTLIdle, session.session_id]);

          return {
               userPublicId: userRows[0]!.public_id.toString("hex"),
               status: userRows[0]!.status_code,
               createdAt: userRows[0]!.created_at,
               identifiers: identifierRows.map((row) => ({ type: row.type_code, value: row.identifier_value, isPrimary: Boolean(row.is_primary) }))
          };
     } catch (error) {
          console.error(error); // todo: audit log?
          return null;
     } finally {
          if (connection) { connection.release(); }
     }
};

export const refreshSession = async (refreshToken: string, rotateRefreshToken: boolean): Promise<SessionTokens | null> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();

          const refreshTokenStatuses = await getRefreshTokenStatuses(connection);
          const sessionStatuses = await getSessionStatuses(connection);

          const rows = await connection.query<{ refresh_token_id: bigint; session_id: bigint; token_family_id: Buffer; refresh_token_status_id: number; expires_at: Date; rotated_at: Date | null; user_id: number; device_id: number; session_status_id: number; absolute_expires_at: Date }[]>("select refresh_tokens.refresh_token_id, refresh_tokens.session_id, refresh_tokens.token_family_id, refresh_tokens.refresh_token_status_id, refresh_tokens.expires_at, refresh_tokens.rotated_at, sessions.user_id, sessions.device_id, sessions.session_status_id, sessions.absolute_expires_at from refresh_tokens inner join sessions on sessions.session_id = refresh_tokens.session_id where refresh_tokens.token_hash = ? limit 1 for update;", [sha256Hex(refreshToken)]);

          if (rows.length === 0) {
               await connection.rollback();
               return null;
          }

          const row = rows[0]!;

          const sessionStatusIdToCode = new Map(Array.from(sessionStatuses.entries()).map(([code, id]) => [id, code]));
          const sessionStatusCode = sessionStatusIdToCode.get(row.session_status_id);
          if (sessionStatusCode !== "active" || row.absolute_expires_at.getTime() <= Date.now()) {
               await connection.rollback();
               return null;
          }

          const statusIdToCode = new Map(Array.from(refreshTokenStatuses.entries()).map(([code, id]) => [id, code]));
          const currentStatus = statusIdToCode.get(row.refresh_token_status_id);

          if (currentStatus === "revoked" || currentStatus === "reuse_detected") {
               await connection.rollback();
               return null;
          }

          if (currentStatus === "rotated") {
               const rotatedMsAgo = row.rotated_at ? Date.now() - row.rotated_at.getTime() : Infinity;
               const withinGracePeriod = rotatedMsAgo <= RefreshTokenRotationDelay * 1000;

               if (!withinGracePeriod) {
                    await connection.query("update refresh_tokens set refresh_token_status_id = ? where token_family_id = ?;", [refreshTokenStatuses.get("reuse_detected"), row.token_family_id]);
                    await connection.query("update sessions set session_status_id = ?, revoked_at = NOW(6), revoked_reason = 'refresh_token_reuse' where session_id = ?;", [sessionStatuses.get("revoked"), row.session_id]);
                    await connection.commit();
                    return null;
               }
          } else if (row.expires_at.getTime() <= Date.now()) {
               await connection.rollback();
               return null;
          }

          const newSessionToken = generateOpaqueToken();
          const { insertId: newSessionTokenId } = await connection.query<InsertRow>("insert into session_tokens (session_id, token_hash, expires_at) values (?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND));",
               [row.session_id, sha256Hex(newSessionToken), TTLSessionToken]);

          let newRefreshToken: string | null = null;

          if (rotateRefreshToken) {
               newRefreshToken = generateOpaqueToken();
               await connection.query<InsertRow>("insert into refresh_tokens (session_id, session_token_id, previous_refresh_token_id, token_family_id, token_hash, refresh_token_status_id, expires_at) values (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(6), INTERVAL ? SECOND));",
                    [row.session_id, newSessionTokenId, row.refresh_token_id, row.token_family_id, sha256Hex(newRefreshToken), refreshTokenStatuses.get("active"), TTLRefreshToken]);

               if (currentStatus !== "rotated") {
                    await connection.query("update refresh_tokens set refresh_token_status_id = ?, rotated_at = NOW(6) where refresh_token_id = ?;", [refreshTokenStatuses.get("rotated"), row.refresh_token_id]);
               }
          } else {
               await connection.query<InsertRow>("update refresh_tokens set session_token_id=? where refresh_token_id = ?;",
                    [newSessionTokenId, row.refresh_token_id]);
          }
          await connection.query("update sessions set last_used_at = NOW(6), idle_expires_at = DATE_ADD(NOW(6), INTERVAL ? SECOND) where session_id = ?;", [TTLIdle, row.session_id]);
          await connection.query("delete from session_tokens where session_id = ? and session_token_id != ?;", [row.session_id, newSessionTokenId]);

          const sessionRows = await connection.query<{ public_id: Buffer; idle_expires_at: Date; absolute_expires_at: Date }[]>("select public_id, idle_expires_at, absolute_expires_at from sessions where session_id = ?;",
               [row.session_id]);

          await connection.commit();
          return {
               sessionPublicId: sessionRows[0]!.public_id.toString("hex"),
               sessionToken: newSessionToken,
               refreshToken: newRefreshToken ?? refreshToken,
               idleExpiresAt: sessionRows[0]!.idle_expires_at,
               absoluteExpiresAt: sessionRows[0]!.absolute_expires_at
          };
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return null;
     } finally {
          if (connection) { connection.release(); }
     }
};

export const logoutSession = async (sessionToken: string): Promise<boolean> => {
     let connection: PoolConnection | null = null;
     try {
          connection = await getPool().getConnection();
          await connection.beginTransaction();

          const sessionStatuses = await getSessionStatuses(connection);

          const sessionRows = await connection.query<{ session_id: bigint }[]>("select sessions.session_id from session_tokens inner join sessions on sessions.session_id = session_tokens.session_id where session_tokens.token_hash = ? limit 1;",
               [sha256Hex(sessionToken)]);

          if (sessionRows.length === 0) {
               await connection.rollback();
               return false;
          }

          await connection.query("update sessions set session_status_id = ?, revoked_at = NOW(6), revoked_reason = 'logout' where session_id = ?;", [sessionStatuses.get("revoked"), sessionRows[0]!.session_id]);
          await connection.query("update session_tokens set revoked_at = NOW(6) where session_id = ?;", [sessionRows[0]!.session_id]);
          await connection.query("update refresh_tokens set refresh_token_status_id = (select refresh_token_status_id from refresh_token_statuses where status_code = 'revoked'), revoked_at = NOW(6) where session_id = ?;", [sessionRows[0]!.session_id]);

          await connection.commit();
          return true;
     } catch (error) {
          if (connection) { await connection.rollback(); }
          console.error(error); // todo: audit log?
          return false;
     } finally {
          if (connection) { connection.release(); }
     }
};