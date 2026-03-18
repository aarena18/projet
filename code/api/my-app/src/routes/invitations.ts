import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.js";
import { getUserByEmail } from "../services/cognito.js";
import { db } from "../db/index.js";

export const invitationRoutes = new Hono();

// POST /teams/:teamId/invitations — inviter un user par email
invitationRoutes.post("/teams/:teamId/invitations", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");
    const { teamId } = c.req.param();
    const { email } = await c.req.json();

    if (!email) return c.json({ error: "email est requis" }, 400);

    // Vérifie que l'invitant est membre de la team
    const memberCheck = await db.query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    if (memberCheck.rows.length === 0) {
      return c.json({ error: "Accès refusé" }, 403);
    }

    // Vérifie que l'email existe dans Cognito
    const cognitoUser = await getUserByEmail(email);
    if (!cognitoUser) {
      return c.json({ error: "Aucun compte trouvé avec cet email" }, 404);
    }

    // Vérifie que l'user n'est pas déjà membre
    const userInDb = await db.query(
      `SELECT id FROM users WHERE cognito_sub = $1`,
      [cognitoUser.sub],
    );
    if (userInDb.rows.length > 0) {
      const alreadyMember = await db.query(
        `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
        [teamId, userInDb.rows[0].id],
      );
      if (alreadyMember.rows.length > 0) {
        return c.json({ error: "Cet utilisateur est déjà membre" }, 409);
      }
    }

    // Vérifie qu'une invitation pending n'existe pas déjà
    const existingInvite = await db.query(
      `SELECT id FROM invitations WHERE team_id = $1 AND email = $2 AND status = 'pending'`,
      [teamId, email],
    );
    if (existingInvite.rows.length > 0) {
      return c.json({ error: "Une invitation est déjà en attente" }, 409);
    }

    // Crée l'invitation
    const result = await db.query(
      `INSERT INTO invitations (team_id, email) VALUES ($1, $2) RETURNING *`,
      [teamId, email],
    );

    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// GET /invitations — mes invitations en attente
invitationRoutes.get("/invitations", requireAuth, async (c) => {
  try {
    const userId = c.get("userId");

    // Récupère l'email depuis Cognito
    const userResult = await db.query(
      `SELECT cognito_sub FROM users WHERE id = $1`,
      [userId],
    );
    const cognitoUser = await (
      await import("../services/cognito.js")
    ).getUserBySub(userResult.rows[0].cognito_sub);

    const result = await db.query(
      `SELECT i.*, t.name as team_name
       FROM invitations i
       INNER JOIN teams t ON t.id = i.team_id
       WHERE i.email = $1 AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
      [cognitoUser.email],
    );

    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// POST /invitations/:invitationId/accept — accepter
invitationRoutes.post(
  "/invitations/:invitationId/accept",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { invitationId } = c.req.param();

      // Récupère l'invitation
      const inviteResult = await db.query(
        `SELECT * FROM invitations WHERE id = $1 AND status = 'pending'`,
        [invitationId],
      );
      if (inviteResult.rows.length === 0) {
        return c.json({ error: "Invitation non trouvée" }, 404);
      }
      const invitation = inviteResult.rows[0];

      // Vérifie que c'est bien l'invitation de cet user
      const userResult = await db.query(
        `SELECT cognito_sub FROM users WHERE id = $1`,
        [userId],
      );
      const cognitoUser = await (
        await import("../services/cognito.js")
      ).getUserBySub(userResult.rows[0].cognito_sub);
      if (cognitoUser.email !== invitation.email) {
        return c.json({ error: "Accès refusé" }, 403);
      }

      // Ajoute comme membre
      await db.query(
        `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
        [invitation.team_id, userId],
      );

      // Met à jour le statut
      await db.query(
        `UPDATE invitations SET status = 'accepted' WHERE id = $1`,
        [invitationId],
      );

      return c.json({ message: "Invitation acceptée" });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Erreur serveur" }, 500);
    }
  },
);

// POST /invitations/:invitationId/reject — refuser
invitationRoutes.post(
  "/invitations/:invitationId/reject",
  requireAuth,
  async (c) => {
    try {
      const userId = c.get("userId");
      const { invitationId } = c.req.param();

      const inviteResult = await db.query(
        `SELECT * FROM invitations WHERE id = $1 AND status = 'pending'`,
        [invitationId],
      );
      if (inviteResult.rows.length === 0) {
        return c.json({ error: "Invitation non trouvée" }, 404);
      }
      const invitation = inviteResult.rows[0];

      const userResult = await db.query(
        `SELECT cognito_sub FROM users WHERE id = $1`,
        [userId],
      );
      const cognitoUser = await (
        await import("../services/cognito.js")
      ).getUserBySub(userResult.rows[0].cognito_sub);
      if (cognitoUser.email !== invitation.email) {
        return c.json({ error: "Accès refusé" }, 403);
      }

      await db.query(
        `UPDATE invitations SET status = 'rejected' WHERE id = $1`,
        [invitationId],
      );

      return c.json({ message: "Invitation refusée" });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Erreur serveur" }, 500);
    }
  },
);
