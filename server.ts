import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // IndiaMART Proxy Route
  app.get("/api/indiamart/leads", async (req, res) => {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ error: "IndiaMART CRM Key is required" });
    }

    try {
      const response = await axios.get("https://mapi.indiamart.com/wservce/crm/crmListing/v2/", {
        params: {
          glusr_crm_key: key,
          glusr_crm_key_source: "CRM"
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("IndiaMART API Error:", error.message);
      res.status(500).json({ error: "Failed to fetch leads from IndiaMART" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
