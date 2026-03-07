import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Supabase Admin Routes
  app.post("/api/admin/create-user", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin not configured" });
    }

    const { email, password, username, role, permissions } = req.body;

    try {
      // 1. Create Auth User
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, role }
      });

      if (authError) throw authError;

      // 2. Create Profile in public.users
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authUser.user.id,
          username,
          email,
          role,
          permissions
        }]);

      if (profileError) throw profileError;

      res.json({ success: true, user: authUser.user });
    } catch (error: any) {
      console.error("Supabase Admin Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/delete-user/:id", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin not configured" });
    }

    const { id } = req.params;

    try {
      // 1. Delete from public.users
      await supabaseAdmin.from('users').delete().eq('id', id);
      
      // 2. Delete Auth User
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Supabase Admin Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

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
