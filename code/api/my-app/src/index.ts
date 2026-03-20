import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/aws-lambda";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { teamRoutes } from "./routes/teams.js";
import { invitationRoutes } from "./routes/invitations.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { assetRoutes } from "./routes/assets.js";
import { adminRoutes } from "./routes/admin.js";
import "dotenv/config";

const app = new Hono();

// CORS — doit être avant toutes les routes
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL || "",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/", (c) => c.json({ status: "API OK" }));
app.route("/", authRoutes);
app.route("/", userRoutes);
app.route("/", teamRoutes);
app.route("/", invitationRoutes);
app.route("/", projectRoutes);
app.route("/", taskRoutes);
app.route("/", assetRoutes);
app.route("/", adminRoutes);

export const handler = handle(app);
export default app;
