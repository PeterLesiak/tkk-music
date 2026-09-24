import { Router } from "express";
import registerRouter from "./register.js";
import loginRouter from "./login.js";
import sessionRouter from "./session.js";
import configRouter from "./config.js";

const authRouter = Router();

authRouter.use(registerRouter);
authRouter.use(loginRouter);
authRouter.use(sessionRouter);
authRouter.use(configRouter);

export default authRouter;
