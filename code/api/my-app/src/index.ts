import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import "dotenv/config";

const app = new Hono();

app.get("/", (c) => c.json({ status: "API OK" }));
app.route("/", authRoutes);
app.route("/", userRoutes);

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("API démarrée sur http://localhost:3000");
});

export default app;
