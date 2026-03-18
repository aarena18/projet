import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { getUserByEmail, getUserBySub } from "../services/cognito.js";
import { db } from "../db/index.js";

export const teamRoutes = new Hono();

// POST /teams — créer une équipe
teamRoutes.post("/teams", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { name } = await c.req.json();

    if (!name) return c.json({ error: "name est requis" }, 400);

    // Crée la team
    const teamResult = await db.query(
      `INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name, userId],
    );
    const team = teamResult.rows[0];

    // Ajoute le créateur comme membre automatiquement
    await db.query(
      `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
      [team.id, userId],
    );

    return c.json(team, 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /teams — liste des équipes de l'utilisateur
teamRoutes.get("/teams", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");

    const result = await db.query(
      `SELECT t.* FROM teams t
       INNER JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId],
    );

    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /teams/:teamId — détail d'une équipe
teamRoutes.get("/teams/:teamId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { teamId } = c.req.param();

    // Vérifie que l'user est membre
    const memberCheck = await db.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(`SELECT * FROM teams WHERE id = $1`, [
      teamId,
    ]);
    if (result.rows.length === 0) {
      return c.json({ error: "Team non trouvée" }, 404);
    }

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /teams/:teamId/members — membres d'une équipe
teamRoutes.get("/teams/:teamId/members", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { teamId } = c.req.param();

    // Vérifie que l'user est membre
    const memberCheck = await db.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    // Récupère tous les membres
    const result = await db.query(
      `SELECT u.id, u.cognito_sub, u.role, tm.joined_at
       FROM team_members tm
       INNER JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1`,
      [teamId],
    );

    // Enrichit avec les données Cognito (nom + email)
    const members = await Promise.all(
      result.rows.map(async (row) => {
        const cognitoUser = await getUserBySub(row.cognito_sub);
        return {
          id: row.id,
          email: cognitoUser.email,
          name: cognitoUser.name,
          role: row.role,
          joined_at: row.joined_at,
        };
      }),
    );

    return c.json(members);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
