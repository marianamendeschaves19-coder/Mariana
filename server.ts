import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("CRITICAL ERROR: DATABASE_URL is not defined in environment variables.");
  console.error("Please set DATABASE_URL in the project settings (e.g., postgresql://user:password@host/dbname?sslmode=require).");
}

const pool = dbUrl 
  ? new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("localhost") ? false : {
        rejectUnauthorized: false,
      },
    })
  : null;

// Test connection on startup if pool exists
if (pool) {
  pool.connect(async (err, client, release) => {
    if (err) {
      console.error("Error connecting to the database:", err.stack);
    } else {
      console.log("Successfully connected to the database");
      try {
        const res = await client?.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios')");
        if (res?.rows[0].exists) {
          console.log("Database schema detected (usuarios table exists)");
        } else {
          console.warn("WARNING: 'usuarios' table not found. Did you run neon_setup.sql?");
        }
      } catch (queryErr) {
        console.error("Error checking schema:", queryErr);
      } finally {
        release();
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user/:uid", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not configured" });
    }
    const { uid } = req.params;
    console.log(`[GET] Fetching user profile for UID: ${uid}`);
    try {
      const result = await pool.query("SELECT * FROM usuarios WHERE firebase_uid = $1", [uid]);
      if (result.rows.length === 0) {
        console.warn(`[GET] User not found for UID: ${uid}`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`[GET] User profile found for UID: ${uid}: ${result.rows[0].nome}`);
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error(`[GET] Error fetching user for UID ${uid}:`, err);
      res.status(500).json({ error: "Database error", details: err.message });
    }
  });

  app.post("/api/register", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: "Database not configured" });
    }
    const { firebase_uid, nome, email, tipo } = req.body;
    console.log(`[POST] Registering new user: ${email} (${tipo}) with Firebase UID: ${firebase_uid}`);
    try {
      const result = await pool.query(
        `INSERT INTO usuarios (firebase_uid, nome, email, tipo) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO UPDATE SET 
           firebase_uid = EXCLUDED.firebase_uid,
           nome = COALESCE(EXCLUDED.nome, usuarios.nome),
           tipo = COALESCE(EXCLUDED.tipo, usuarios.tipo)
         RETURNING *`,
        [firebase_uid, nome, email, tipo]
      );
      console.log(`[POST] User registered/updated successfully in DB: ${result.rows[0].id}`);
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error(`[POST] Error registering user ${email}:`, err);
      res.status(500).json({ error: "Database error", details: err.message });
    }
  });

  app.get("/api/data", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ 
        error: "Database connection not configured. Please set DATABASE_URL environment variable." 
      });
    }

    try {
      const [
        users,
        classes,
        students,
        routines,
        logs,
        plans,
        posts,
        events,
        menus,
        messages
      ] = await Promise.all([
        pool.query("SELECT * FROM usuarios"),
        pool.query("SELECT * FROM turmas"),
        pool.query("SELECT * FROM alunos"),
        pool.query("SELECT * FROM diario_aluno"),
        pool.query("SELECT * FROM registros_rotina"),
        pool.query("SELECT * FROM planejamento_professor"),
        pool.query("SELECT * FROM mural ORDER BY created_at DESC"),
        pool.query("SELECT * FROM eventos"),
        pool.query("SELECT * FROM cardapio"),
        pool.query("SELECT * FROM mensagens")
      ]);

      res.json({
        usuarios: users.rows,
        turmas: classes.rows,
        alunos: students.rows,
        diario_aluno: routines.rows,
        registros_rotina: logs.rows,
        planejamento_professor: plans.rows,
        mural: posts.rows,
        eventos: events.rows,
        cardapio: menus.rows,
        mensagens: messages.rows
      });
    } catch (err: any) {
      console.error("Database error in /api/data:", err);
      res.status(500).json({ error: "Erro ao buscar dados no banco de dados", details: err.message });
    }
  });

  app.post("/api/execute", async (req, res) => {
    if (!pool) {
      return res.status(503).json({ 
        error: "Database connection not configured. Please set DATABASE_URL environment variable." 
      });
    }

    const { query, values } = req.body;
    try {
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err: any) {
      console.error("Database error in /api/execute:", err);
      res.status(500).json({ error: "Erro ao executar query no banco de dados", details: err.message });
    }
  });

  // Fallback for API routes to avoid HTML responses
  app.all("/api/*all", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
