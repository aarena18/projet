import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const requireAuth = createMiddleware<{
  Variables: { userId: string; role: string };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token manquant" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    c.set("userId", payload.userId);
    c.set("role", payload.role);
    await next();
  } catch {
    return c.json({ error: "Token invalide ou expiré" }, 401);
  }
});
