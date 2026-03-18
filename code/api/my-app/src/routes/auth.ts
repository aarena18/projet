import { Hono } from "hono";
import { signUp, signIn } from "../services/cognito.js";
import { db } from "../db/index.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const authRoutes = new Hono();

// POST /users — inscription
authRoutes.post("/users", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "email, password et name sont requis" }, 400);
    }
    await signUp(email, password, name);
    return c.json({ message: "Compte créé avec succès" }, 201);
  } catch (err: any) {
    if (err.name === "UsernameExistsException") {
      return c.json({ error: "Cet email est déjà utilisé" }, 409);
    }
    if (err.name === "InvalidPasswordException") {
      return c.json({ error: "Mot de passe trop faible" }, 400);
    }
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// POST /auth/login — connexion
authRoutes.post("/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "email et password sont requis" }, 400);
    }
    const authResult = await signIn(email, password);
    if (!authResult?.IdToken) {
      return c.json({ error: "Identifiants incorrects" }, 401);
    }
    const decoded = jwt.decode(authResult.IdToken) as { sub: string };
    const cognitoSub = decoded.sub;
    await db.query(
      `INSERT INTO users (cognito_sub) VALUES ($1) ON CONFLICT (cognito_sub) DO NOTHING`,
      [cognitoSub],
    );
    const result = await db.query(
      `SELECT id, role FROM users WHERE cognito_sub = $1`,
      [cognitoSub],
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );
    return c.json({ token });
  } catch (err: any) {
    if (err.name === "NotAuthorizedException") {
      return c.json({ error: "Email ou mot de passe incorrect" }, 401);
    }
    if (err.name === "UserNotConfirmedException") {
      return c.json({ error: "Compte non confirmé" }, 401);
    }
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
