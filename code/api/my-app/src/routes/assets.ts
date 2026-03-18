import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { uploadFile, deleteFile, getSignedFileUrl } from "../services/s3.js";
import { db } from "../db/index.js";
import { randomUUID } from "crypto";

export const assetRoutes = new Hono();

// POST /tasks/:taskId/assets — uploader un fichier
assetRoutes.post("/tasks/:taskId/assets", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { taskId } = c.req.param();

    // Vérifie que l'user est membre du projet
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

    // Récupère le fichier depuis le form-data
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file) return c.json({ error: "Fichier manquant" }, 400);

    // Génère une clé unique pour S3
    const ext = file.name.split(".").pop();
    const s3Key = `tasks/${taskId}/${randomUUID()}.${ext}`;

    // Upload sur S3
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(s3Key, buffer, file.type);

    // Sauvegarde en BDD
    const result = await db.query(
      `INSERT INTO assets (task_id, filename, s3_key)
       VALUES ($1, $2, $3) RETURNING *`,
      [taskId, file.name, s3Key],
    );

    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /tasks/:taskId/assets — liste des fichiers d'une tâche
assetRoutes.get("/tasks/:taskId/assets", requireAuth, async (c) => {
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

    const result = await db.query(
      `SELECT * FROM assets WHERE task_id = $1 ORDER BY created_at DESC`,
      [taskId],
    );

    // Génère une URL signée pour chaque fichier
    const assets = await Promise.all(
      result.rows.map(async (asset) => ({
        ...asset,
        url: await getSignedFileUrl(asset.s3_key),
      })),
    );

    return c.json(assets);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// DELETE /assets/:assetId — supprimer un fichier
assetRoutes.delete("/assets/:assetId", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { assetId } = c.req.param();

    // Récupère l'asset
    const assetResult = await db.query(
      `SELECT a.* FROM assets a
       INNER JOIN tasks t ON t.id = a.task_id
       INNER JOIN projects p ON p.id = t.project_id
       INNER JOIN team_members tm ON tm.team_id = p.team_id
       WHERE a.id = $1 AND tm.user_id = $2`,
      [assetId, userId],
    );
    if (assetResult.rows.length === 0) {
      return c.json({ error: "Asset non trouvé" }, 404);
    }
    const asset = assetResult.rows[0];

    // Supprime de S3
    await deleteFile(asset.s3_key);

    // Supprime de la BDD
    await db.query(`DELETE FROM assets WHERE id = $1`, [assetId]);

    return c.json({ message: "Fichier supprimé" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});
