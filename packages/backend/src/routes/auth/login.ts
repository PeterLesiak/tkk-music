import { Router } from "express";
import {
     startLoginSession,
     continueLoginSession,
     refreshSession,
     authMethodDisplayNames,
     type LoginCredential
} from "../../data/users.js";
import { requireBearerToken, requireIdentity, requireStringField } from "../../middlewares/auth.js";

const loginRouter = Router();

const serialiseTokens = (tokens: {
     sessionPublicId: string;
     sessionToken: string;
     idleExpiresAt: Date;
     absoluteExpiresAt: Date;
}) => ({
     sessionId: tokens.sessionPublicId,
     sessionToken: tokens.sessionToken,
     idleExpiresAt: tokens.idleExpiresAt.toISOString(),
     absoluteExpiresAt: tokens.absoluteExpiresAt.toISOString()
});

loginRouter.post("/login",
     requireStringField("nonce"),
     requireIdentity,
     async (req, res) => {
          const { identity, identityType } = req.identity!;

          const result = await startLoginSession(identity, identityType, req.body.nonce);
          if (result.status === "failed" || !result.requiredAuthMethod) {
               res.status(401).json({ error: "invalid credentials" });
               return;
          }

          res.json({
               id: result.loginAttemptPublicId,
               methods: [
                    {
                         code: result.requiredAuthMethod,
                         name: authMethodDisplayNames[result.requiredAuthMethod]
                    }
               ]
          });
     });

const parseCredential = (method: unknown, value: unknown): LoginCredential | null => {
     if (typeof value !== "string") { return null; }

     switch (method) {
          case "password":
               return { method: "password", password: value };
          case "totp":
               return { method: "totp", code: value };
          case "recovery_code":
               return { method: "recovery_code", code: value };
          default:
               return null;
     }
};

loginRouter.post("/login/next/:id", async (req, res) => {
     const loginAttemptPublicId = req.params.id;
     if (!loginAttemptPublicId || !req.body || req.body.value === undefined) {
          res.status(400).json({ error: "missing fields" });
          return;
     }

     const credential = parseCredential(req.body.method, req.body.value);
     if (!credential) {
          res.status(400).json({ error: "unsupported method" });
          return;
     }

     const deviceToken = typeof req.body.deviceToken === "string" ? req.body.deviceToken : null;
     const result = await continueLoginSession(loginAttemptPublicId, credential, deviceToken);

     switch (result.status) {
          case "failed":
               res.status(401).json({ error: "invalid credentials!" });
               return;
          case "expired":
               res.status(410).json({ error: "login attempt expired" });
               return;
          case "mfa_pending":
               res.json({
                    methods: [
                         {
                              code: result.requiredAuthMethod,
                              name: authMethodDisplayNames[result.requiredAuthMethod]
                         }
                    ]
               });
               return;
          default:
               res.json(serialiseTokens(result.tokens));
     }
});

loginRouter.get("/refresh", requireBearerToken, async (req, res) => {
     const tokens = await refreshSession(req.bearerToken!, false);
     if (!tokens) {
          res.status(401).json({ error: "invalid or expired refresh token" });
          return;
     }
     res.json(serialiseTokens(tokens));
});

export default loginRouter;