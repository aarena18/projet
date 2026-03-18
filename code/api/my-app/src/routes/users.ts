import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { getUserBySub, updateUserBySub } from "../services/cognito.js";
import { db } from "../db/index.js";

export const userRoutes = new Hono();

// GET /me
userRoutes.get("/me", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const result = await db.query(
      `SELECT cognito_sub, role FROM users WHERE id = $1`,
      [userId],
    );
    const user = result.rows[0];
    if (!user) return c.json({ error: "User non trouvé" }, 404);
    const cognitoUser = await getUserBySub(user.cognito_sub);
    return c.json({
      id: userId,
      email: cognitoUser.email,
      name: cognitoUser.name,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// PATCH /me
userRoutes.patch("/me", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { name } = await c.req.json();
    const result = await db.query(
      `SELECT cognito_sub FROM users WHERE id = $1`,
      [userId],
    );
    const user = result.rows[0];
    if (!user) return c.json({ error: "User non trouvé" }, 404);
    await updateUserBySub(user.cognito_sub, { name });
    return c.json({ message: "Profil mis à jour" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
