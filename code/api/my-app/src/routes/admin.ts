import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { getSignedFileUrl } from "../services/s3.js";
import { getUserBySub } from "../services/cognito.js";
import { db } from "../db/index.js";

export const adminRoutes = new Hono();

// Middleware admin — vérifie le rôle
const requireAdmin = async (c: any, next: any) => {
  const role = c.get("role");
  if (role !== "admin") {
    return c.json({ error: "Accès réservé aux administrateurs" }, 403);
  }
  await next();
};

// GET /admin/stats — dashboard stats
adminRoutes.get("/admin/stats", requireAuth, requireAdmin, async (c) => {
  try {
    const [users, teams, projects, tasks] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users`),
      db.query(`SELECT COUNT(*) FROM teams`),
      db.query(`SELECT COUNT(*) FROM projects`),
      db.query(`SELECT COUNT(*) FROM tasks`),
    ]);

    return c.json({
      users: parseInt(users.rows[0].count),
      teams: parseInt(teams.rows[0].count),
      projects: parseInt(projects.rows[0].count),
      tasks: parseInt(tasks.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /admin/users — liste tous les users
adminRoutes.get("/admin/users", requireAuth, requireAdmin, async (c) => {
  try {
    const result = await db.query(
      `SELECT id, cognito_sub, role, created_at FROM users ORDER BY created_at DESC`,
    );

    // Enrichit avec les données Cognito
    const users = await Promise.all(
      result.rows.map(async (user) => {
        try {
          const cognitoUser = await getUserBySub(user.cognito_sub);
          return {
            id: user.id,
            email: cognitoUser.email,
            name: cognitoUser.name,
            role: user.role,
            created_at: user.created_at,
          };
        } catch {
          return { id: user.id, role: user.role, created_at: user.created_at };
        }
      }),
    );

    return c.json(users);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /admin/backups — liste des backups
adminRoutes.get("/admin/backups", requireAuth, requireAdmin, async (c) => {
  try {
    const result = await db.query(
      `SELECT * FROM backups ORDER BY created_at DESC`,
    );

    // Génère une URL signée pour chaque backup
    const backups = await Promise.all(
      result.rows.map(async (backup) => ({
        ...backup,
        url: await getSignedFileUrl(backup.s3_key),
      })),
    );

    return c.json(backups);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
