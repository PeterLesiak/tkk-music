import type { NextFunction, Request, Response } from "express";
import type { IdentityType } from "../data/users.js";

export const extractIdentity = (body: Partial<{ username: string; email: string; phone: string; }>): { identity: string; identityType: IdentityType } | null => {
     const username = typeof body?.username === "string" ? body.username.trim() : null;
     const email = typeof body?.email === "string" ? body.email.trim() : null;
     const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

     if (username) {return { identity: username, identityType: "username" };}
     if (email) {return { identity: email, identityType: "email" };}
     if (phone) {return { identity: phone, identityType: "phone" };}
     return null;
};

export const extractBearerToken = (authorisation: string | undefined): string | null => {
     if (!authorisation || !authorisation.startsWith("Bearer ")) {return null;}
     return authorisation.slice("Bearer ".length).trim() || null;
};

declare global {
     // eslint-disable-next-line @typescript-eslint/no-namespace
     namespace Express {
          interface Request {
               bearerToken?: string;
               identity?: { identity: string; identityType: "username" | "email" | "phone" };
          }
     }
}

export const requireBearerToken = (req: Request, res: Response, next: NextFunction) => {
     const token = extractBearerToken(req.headers.authorization);
     if (!token) {
          res.status(401).json({ error: "missing authorization header" });
          return;
     }
     req.bearerToken = token;
     next();
};

export const requireIdentity = (req: Request, res: Response, next: NextFunction) => {
     const identity = extractIdentity(req.body);
     if (!identity) {
          res.status(400).json({ error: "missing identity fields" });
          return;
     }
     req.identity = identity;
     next();
};

export const requireStringField = (field: string) => (req: Request, res: Response, next: NextFunction) => {
     const value = req.body?.[field];
     if (typeof value !== "string" || value.length === 0) {
          res.status(400).json({ error: `missing ${field} field` });
          return;
     }
     next();
};