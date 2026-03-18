import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { db } from "../db/index.js";

export const taskRoutes = new Hono();

// POST /projects/:projectId/tasks — créer une tâche
taskRoutes.post("/projects/:projectId/tasks", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { projectId } = c.req.param();
    const { name, description, status } = await c.req.json();

    if (!name) return c.json({ error: "name est requis" }, 400);

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
      `INSERT INTO tasks (project_id, name, description, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [projectId, name, description || null, status || "todo"],
    );

    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /projects/:projectId/tasks — liste des tâches
taskRoutes.get("/projects/:projectId/tasks", requireAuth, async (c) => {
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

    const result = await db.query(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId],
    );

    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /tasks/:taskId — détail d'une tâche
taskRoutes.get("/tasks/:taskId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();

    const result = await db.query(
      `SELECT t.* FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       INNER JOIN team_members tm ON tm.team_id = p.team_id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, userId],
    );
    if (result.rows.length === 0) {
      return c.json({ error: "Tâche non trouvée" }, 404);
    }

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// PATCH /tasks/:taskId — modifier une tâche
taskRoutes.patch("/tasks/:taskId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();
    const { name, description } = await c.req.json();

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       INNER JOIN tasks t ON t.project_id = p.id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `UPDATE tasks SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
       WHERE id = $3 RETURNING *`,
      [name || null, description || null, taskId],
    );

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// DELETE /tasks/:taskId — supprimer une tâche
taskRoutes.delete("/tasks/:taskId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       INNER JOIN tasks t ON t.project_id = p.id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    await db.query(`DELETE FROM tasks WHERE id = $1`, [taskId]);

    return c.json({ message: "Tâche supprimée" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// PATCH /tasks/:taskId/assign — assigner à un membre
taskRoutes.patch("/tasks/:taskId/assign", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();
    const { assignedUserId } = await c.req.json();

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       INNER JOIN tasks t ON t.project_id = p.id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `UPDATE tasks SET assigned_to = $1 WHERE id = $2 RETURNING *`,
      [assignedUserId, taskId],
    );

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// PATCH /tasks/:taskId/status — changer le statut
taskRoutes.patch("/tasks/:taskId/status", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();
    const { status } = await c.req.json();

    const validStatuses = ["todo", "in_progress", "done"];
    if (!validStatuses.includes(status)) {
      return c.json(
        { error: "Statut invalide (todo, in_progress, done)" },
        400,
      );
    }

    const memberCheck = await db.query(
      `SELECT tm.id FROM team_members tm
       INNER JOIN projects p ON p.team_id = tm.team_id
       INNER JOIN tasks t ON t.project_id = p.id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    const result = await db.query(
      `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
      [status, taskId],
    );

    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
