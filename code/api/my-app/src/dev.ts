import { serve } from "@hono/node-server";
import app from "./index.js";

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("API démarrée sur http://localhost:3000");
});
