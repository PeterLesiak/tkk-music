import { Router } from "express";
import { getUserConfiguration } from "../../data/users.js";
import { requireBearerToken } from "../../middlewares/auth.js";

const configRouter = Router();


configRouter.get("/config", requireBearerToken, async (req, res) => {
     const config = await getUserConfiguration(req.bearerToken!);
     if (!config) {
          res.status(401).json({
               error: "unauthorised"
          });
          return;
     }
     res.json(config);
});

export default configRouter;
