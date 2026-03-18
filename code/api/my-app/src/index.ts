import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { teamRoutes } from "./routes/teams.js";
import { invitationRoutes } from "./routes/invitations.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import "dotenv/config";

const app = new Hono();

app.get("/", (c) => c.json({ status: "API OK" }));
app.route("/", authRoutes);
app.route("/", userRoutes);
app.route("/", teamRoutes);
app.route("/", invitationRoutes);
app.route("/", projectRoutes);
app.route("/", taskRoutes);

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("API démarrée sur http://localhost:3000");
});

export default app;
