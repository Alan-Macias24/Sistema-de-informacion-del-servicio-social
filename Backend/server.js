import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Config BD
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // cámbialo por tu usuario de MySQL
  password: "",       // cámbialo por tu contraseña de MySQL
  database: "servicio_social"
});

// Conexión
db.connect(err => {
  if (err) {
    console.error(" Error al conectar a la BD:", err);
    return;
  }
  console.log(" Conectado a MySQL");
});

// Ruta de login con código (matrícula) + contraseña
app.post("/login", (req, res) => {
  const { codigo, password } = req.body;

  const sql = `
    SELECT u.*, p.matricula 
    FROM usuarios u
    INNER JOIN prestadores p ON u.id_usuario = p.id_prestador
    WHERE p.matricula = ? AND u.contraseña = ?;
  `;

  db.query(sql, [codigo, password], (err, results) => {
    if (err) {
      console.error(" Error en consulta:", err);
      return res.json({ status: "error", message: "Error interno" });
    }

    if (results.length > 0) {
      const user = results[0];

      if (user.estado !== "activo") {
        return res.json({ status: "error", message: "Usuario inactivo" });
      }

      res.json({ status: "ok", user });
    } else {
      res.json({ status: "error", message: "Código o contraseña incorrectos" });
    }
  });
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
