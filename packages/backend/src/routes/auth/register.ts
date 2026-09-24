import { Router } from "express";
import { registerUser, createSessionAfterRegistration } from "../../data/users.js";
import { requireIdentity, requireStringField } from "../../middlewares/auth.js";

const registerRouter = Router();

registerRouter.post("/register", requireStringField("password"), requireIdentity, async (req, res) => {
     const { identity, identityType } = req.identity!;

     const registerResult = await registerUser(identity, identityType, req.body.password);
     if (!registerResult) {
          res.status(409).json({ error: "registration failed" });
          return;
     }

     const deviceToken = typeof req.body.deviceToken === "string" ? req.body.deviceToken : null;
     const tokens = await createSessionAfterRegistration(registerResult.userId, deviceToken);
     if (!tokens) {
          res.status(500).json({ error: "registration succeeded but session creation failed" });
          return;
     }

     res.json({ refreshToken: tokens.refreshToken });
});

export default registerRouter;