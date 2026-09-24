import { Router } from "express";
import { getSelfInfo, refreshSession, logoutSession } from "../../data/users.js";
import { requireBearerToken } from "../../middlewares/auth.js";

const sessionRouter = Router();

sessionRouter.get("/me", requireBearerToken, async (req, res) => {
     const self = await getSelfInfo(req.bearerToken!);
     if (!self) {
          res.status(401).json({ error: "invalid or expired session" });
          return;
     }

     res.json({
          public_id: self.userPublicId,
          identities: self.identifiers.map((identifier) => ({
               type: identifier.type,
               value: identifier.value
          }))
     });
});

sessionRouter.get("/rotate", requireBearerToken, async (req, res) => {
     const tokens = await refreshSession(req.bearerToken!, true);
     if (!tokens) {
          res.status(401).json({ error: "invalid or expired refresh token" });
          return;
     }

     res.json({
          sessionToken: tokens.sessionToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.idleExpiresAt
     });
});

sessionRouter.post("/logout", requireBearerToken, async (req, res) => {
     await logoutSession(req.bearerToken!);
     res.json({});
});

export default sessionRouter;