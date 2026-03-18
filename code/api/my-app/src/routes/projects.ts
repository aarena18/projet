import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { db } from "../db/index.js";

export const projectRoutes = new Hono();

// POST /teams/:teamId/projects — créer un projet
projectRoutes.post("/teams/:teamId/projects", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { teamId } = c.req.param();
    const { name, description } = await c.req.json();

    if (!name) return c.json({ error: "name est requis" }, 400);

    const memberCheck = await db.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `INSERT INTO projects (team_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [teamId, name, description || null],
    );

    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /teams/:teamId/projects — liste des projets
projectRoutes.get("/teams/:teamId/projects", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { teamId } = c.req.param();

    const memberCheck = await db.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC`,
      [teamId],
    );

    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /projects/:projectId — détail d'un projet
projectRoutes.get("/projects/:projectId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { projectId } = c.req.param();

    const result = await db.query(
      `SELECT p.* FROM projects p
       INNER JOIN team_members tm ON tm.team_id = p.team_id
       WHERE p.id = $1 AND tm.user_id = $2`,
      [projectId, userId],
    );
    if (result.rows.length === 0) {
      return c.json({ error: "Projet non trouvé" }, 404);
    }

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// PATCH /projects/:projectId — modifier un projet
projectRoutes.patch("/projects/:projectId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { projectId } = c.req.param();
    const { name, description } = await c.req.json();

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       WHERE p.id = $1 AND tm.user_id = $2`,
      [projectId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
       WHERE id = $3 RETURNING *`,
      [name || null, description || null, projectId],
    );

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// DELETE /projects/:projectId — supprimer un projet
projectRoutes.delete("/projects/:projectId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { projectId } = c.req.param();

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       WHERE p.id = $1 AND tm.user_id = $2`,
      [projectId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    await db.query(`DELETE FROM projects WHERE id = $1`, [projectId]);

    return c.json({ message: "Projet supprimé" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
