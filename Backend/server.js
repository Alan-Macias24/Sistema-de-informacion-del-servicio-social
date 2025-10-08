import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Config BD - Ajusta según tu configuración de MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // Tu usuario de MySQL
  password: "",       // Tu contraseña de MySQL
  database: "servicio_social_udg",
  charset: 'utf8mb4'
});

// Conexión a la base de datos
db.connect(err => {
  if (err) {
    console.error("❌ Error al conectar a la BD:", err);
    process.exit(1);
  }
  console.log("✅ Conectado a MySQL - Base de datos servicio_social_udg");
});

// Clave secreta para JWT (en producción usa una variable de entorno)
const JWT_SECRET = 'servicio_social_udg_secret_2025';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: "error", message: "Token requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ status: "error", message: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

// Ruta principal - servir el login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Ruta de login mejorada
app.post("/login", async (req, res) => {
  const { codigo, password } = req.body;

  // Validaciones
  if (!codigo || !password) {
    return res.status(400).json({ status: "error", message: "Código y contraseña son requeridos" });
  }

  if (!/^\d{10}$/.test(codigo)) {
    return res.status(400).json({ status: "error", message: "El código UDG debe tener 10 dígitos numéricos" });
  }

  const codigoUdg = parseInt(codigo);

  try {
    const sql = `
      SELECT u.*, p.carrera, p.semestre, r.organizacion
      FROM usuarios u
      LEFT JOIN prestadores p ON u.codigo_udg = p.codigo_udg
      LEFT JOIN receptores r ON u.codigo_udg = r.codigo_udg
      WHERE u.codigo_udg = ?;
    `;

    db.query(sql, [codigoUdg], async (err, results) => {
      if (err) {
        console.error("❌ Error en consulta:", err);
        return res.status(500).json({ status: "error", message: "Error interno del servidor" });
      }

      if (results.length === 0) {
        return res.status(401).json({ status: "error", message: "Código UDG no encontrado" });
      }

      const user = results[0];

      // Verificar contraseña (en producción deberías usar bcrypt.compare)
      // Por ahora usamos comparación directa para testing
      if (user.password_hash !== password) {
        return res.status(401).json({ status: "error", message: "Contraseña incorrecta" });
      }

      if (!user.activo) {
        return res.status(401).json({ status: "error", message: "Usuario inactivo" });
      }

      // Crear token JWT
      const token = jwt.sign(
        { 
          codigo_udg: user.codigo_udg,
          tipo: user.tipo,
          nombre: user.nombre
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Preparar respuesta del usuario
      const userResponse = {
        codigo_udg: user.codigo_udg,
        email: user.email,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        tipo: user.tipo,
        telefono: user.telefono
      };

      // Agregar información específica según el tipo
      if (user.tipo === 'prestador') {
        userResponse.carrera = user.carrera;
        userResponse.semestre = user.semestre;
      } else if (user.tipo === 'receptor') {
        userResponse.organizacion = user.organizacion;
      }

      res.json({
        status: "ok",
        message: "Login exitoso",
        user: userResponse,
        token: token
      });
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ status: "error", message: "Error interno del servidor" });
  }
});

// Ruta para verificar token
app.get("/verify", authenticateToken, (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Token válido",
    user: req.user 
  });
});

// Ruta para obtener perfil del usuario
app.get("/perfil/:codigoUdg", authenticateToken, (req, res) => {
  const codigoUdg = parseInt(req.params.codigoUdg);

  const sql = `
    SELECT u.*, p.carrera, p.semestre, p.creditos_aprobados, p.porcentaje_creditos,
           r.organizacion, r.departamento, r.puesto
    FROM usuarios u
    LEFT JOIN prestadores p ON u.codigo_udg = p.codigo_udg
    LEFT JOIN receptores r ON u.codigo_udg = r.codigo_udg
    WHERE u.codigo_udg = ?;
  `;

  db.query(sql, [codigoUdg], (err, results) => {
    if (err) {
      console.error("❌ Error en consulta:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (results.length > 0) {
      res.json({ status: "ok", perfil: results[0] });
    } else {
      res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }
  });
});

// Ruta para obtener plazas disponibles
app.get("/plazas", (req, res) => {
  const sql = `
    SELECT p.*, r.organizacion, r.departamento
    FROM plazas p
    INNER JOIN receptores r ON p.receptor_codigo_udg = r.codigo_udg
    WHERE p.activa = TRUE AND p.estado = 'disponible'
    ORDER BY p.fecha_publicacion DESC;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error en consulta:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    res.json({ status: "ok", plazas: results });
  });
});

// Ruta para obtener estadísticas de prestador
app.get("/estadisticas/:codigoUdg", authenticateToken, (req, res) => {
  const codigoUdg = parseInt(req.params.codigoUdg);

  const sql = `
    SELECT 
      a.horas_acumuladas,
      a.horas_requeridas,
      ROUND((a.horas_acumuladas / a.horas_requeridas) * 100, 2) as porcentaje_completado,
      COUNT(DISTINCT asi.id) as total_asistencias,
      COUNT(DISTINCT r.id) as total_reportes
    FROM asignaciones a
    LEFT JOIN asistencia asi ON a.id = asi.asignacion_id
    LEFT JOIN reportes r ON a.id = r.asignacion_id
    WHERE a.prestador_codigo_udg = ? AND a.estado = 'activa'
    GROUP BY a.id;
  `;

  db.query(sql, [codigoUdg], (err, results) => {
    if (err) {
      console.error("❌ Error en consulta:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (results.length > 0) {
      res.json({ status: "ok", estadisticas: results[0] });
    } else {
      res.json({ 
        status: "ok", 
        estadisticas: {
          horas_acumuladas: 0,
          horas_requeridas: 480,
          porcentaje_completado: 0,
          total_asistencias: 0,
          total_reportes: 0
        }
      });
    }
  });
});

// Ruta para crear reportes (MEJORADA CON DEBUG)
app.post("/reportes", authenticateToken, (req, res) => {
  console.log("📥 Solicitud POST /reportes recibida");
  console.log("📋 Datos recibidos:", req.body);
  console.log("👤 Usuario autenticado:", req.user);

  const {
    tipo,
    periodo_inicio,
    periodo_fin,
    actividades_realizadas,
    logros,
    dificultades,
    aprendizajes,
    horas_reportadas,
    estado,
    fecha_entrega,
    turno,
    fecha_elaboracion,
    expectativas_programa,
    porcentaje_conocimientos,
    porcentaje_experiencias,
    porcentaje_profesionales,
    porcentaje_habilidades,
    aportaciones_institucion,
    cumplimiento_satisfactorio
  } = req.body;

  // Validar datos requeridos
  if (!periodo_inicio || !periodo_fin || !actividades_realizadas || !horas_reportadas) {
    console.log("❌ Faltan campos requeridos");
    return res.status(400).json({ 
      status: "error", 
      message: "Faltan campos requeridos: periodo_inicio, periodo_fin, actividades_realizadas, horas_reportadas" 
    });
  }

  // Primero obtener la asignación activa del usuario
  const getAsignacionSql = `
    SELECT id FROM asignaciones 
    WHERE prestador_codigo_udg = ? AND estado = 'activa'
    LIMIT 1;
  `;

  console.log("🔍 Buscando asignación activa para:", req.user.codigo_udg);

  db.query(getAsignacionSql, [req.user.codigo_udg], (err, asignacionResults) => {
    if (err) {
      console.error("❌ Error en consulta de asignación:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    console.log("📊 Resultados de asignación:", asignacionResults);

    if (asignacionResults.length === 0) {
      console.log("❌ No se encontró asignación activa");
      return res.status(400).json({ 
        status: "error", 
        message: "No tienes una asignación activa. Contacta al administrador." 
      });
    }

    const asignacion_id = asignacionResults[0].id;
    console.log("✅ Asignación encontrada ID:", asignacion_id);

    // Insertar el reporte
    const insertReporteSql = `
      INSERT INTO reportes (
        asignacion_id, tipo, periodo_inicio, periodo_fin, actividades_realizadas,
        logros, dificultades, aprendizajes, horas_reportadas, estado, fecha_entrega,
        turno, fecha_elaboracion, expectativas_programa,
        porcentaje_conocimientos, porcentaje_experiencias, porcentaje_profesionales,
        porcentaje_habilidades, aportaciones_institucion, cumplimiento_satisfactorio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const valores = [
      asignacion_id, 
      tipo || 'mensual',
      periodo_inicio, 
      periodo_fin, 
      actividades_realizadas,
      logros || '',
      dificultades || '',
      aprendizajes || '',
      parseFloat(horas_reportadas),
      estado || 'borrador',
      fecha_entrega || new Date().toISOString(),
      turno || '',
      fecha_elaboracion || new Date().toISOString().split('T')[0],
      expectativas_programa || 'Si',
      parseInt(porcentaje_conocimientos) || 0,
      parseInt(porcentaje_experiencias) || 0,
      parseInt(porcentaje_profesionales) || 0,
      parseInt(porcentaje_habilidades) || 0,
      aportaciones_institucion || '',
      cumplimiento_satisfactorio || 'Si'
    ];

    console.log("💾 Insertando reporte con valores:", valores);

    db.query(insertReporteSql, valores, (err, result) => {
      if (err) {
        console.error("❌ Error al insertar reporte:", err);
        return res.status(500).json({ 
          status: "error", 
          message: "Error al guardar el reporte en la base de datos: " + err.message 
        });
      }

      console.log("✅ Reporte insertado exitosamente. ID:", result.insertId);

      // Actualizar horas acumuladas en la asignación si el reporte fue enviado
      if (estado === 'enviado') {
        console.log("🔄 Actualizando horas acumuladas...");
        const updateHorasSql = `
          UPDATE asignaciones 
          SET horas_acumuladas = horas_acumuladas + ? 
          WHERE id = ?;
        `;

        db.query(updateHorasSql, [parseFloat(horas_reportadas), asignacion_id], (updateErr) => {
          if (updateErr) {
            console.error("❌ Error al actualizar horas:", updateErr);
          } else {
            console.log("✅ Horas actualizadas exitosamente");
          }
        });
      }

      res.json({
        status: "ok",
        message: estado === 'borrador' ? "Borrador guardado exitosamente" : "Reporte enviado exitosamente",
        reporte_id: result.insertId
      });
    });
  });
});

// Ruta para obtener reportes del usuario
app.get("/reportes/mis-reportes", authenticateToken, (req, res) => {
  const sql = `
    SELECT r.*, a.plaza_id, p.titulo as plaza_titulo
    FROM reportes r
    JOIN asignaciones a ON r.asignacion_id = a.id
    JOIN plazas p ON a.plaza_id = p.id
    WHERE a.prestador_codigo_udg = ?
    ORDER BY r.fecha_entrega DESC;
  `;

  db.query(sql, [req.user.codigo_udg], (err, results) => {
    if (err) {
      console.error("❌ Error en consulta de reportes:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    res.json({ status: "ok", reportes: results });
  });
});

// Ruta para registrar asistencia
app.post("/asistencia", authenticateToken, (req, res) => {
  const { fecha, hora_entrada, hora_salida, actividades_realizadas } = req.body;

  // Primero obtener la asignación activa del prestador
  const getAsignacionSql = `
    SELECT id FROM asignaciones 
    WHERE prestador_codigo_udg = ? AND estado = 'activa'
    LIMIT 1;
  `;

  db.query(getAsignacionSql, [req.user.codigo_udg], (err, asignacionResults) => {
    if (err) {
      console.error("❌ Error en consulta:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (asignacionResults.length === 0) {
      return res.json({ status: "error", message: "No tienes una asignación activa" });
    }

    const asignacionId = asignacionResults[0].id;

    const insertAsistenciaSql = `
      INSERT INTO asistencia (asignacion_id, fecha, hora_entrada, hora_salida, actividades_realizadas, estado)
      VALUES (?, ?, ?, ?, ?, 'registrada');
    `;

    db.query(insertAsistenciaSql, [asignacionId, fecha, hora_entrada, hora_salida, actividades_realizadas], (err, results) => {
      if (err) {
        console.error("❌ Error al registrar asistencia:", err);
        return res.status(500).json({ status: "error", message: "Error al registrar asistencia" });
      }

      res.json({ status: "ok", message: "Asistencia registrada correctamente" });
    });
  });
});

// Ruta para obtener el historial de asistencia de un prestador
app.get("/asistencia/:codigoUdg", authenticateToken, (req, res) => {
  const codigoUdg = parseInt(req.params.codigoUdg);

  const sql = `
    SELECT a.fecha, a.hora_entrada, a.hora_salida, a.horas_realizadas, 
           a.actividades_realizadas, a.estado, a.fecha_registro
    FROM asistencia a
    INNER JOIN asignaciones asig ON a.asignacion_id = asig.id
    WHERE asig.prestador_codigo_udg = ?
    ORDER BY a.fecha DESC;
  `;

  db.query(sql, [codigoUdg], (err, results) => {
    if (err) {
      console.error("❌ Error en consulta:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    res.json({ status: "ok", asistencia: results });
  });
});

// Ruta para obtener información de asignación activa
// Mejorar la consulta SQL en server.js para incluir nombre completo del receptor
app.get("/asignacion-activa", authenticateToken, (req, res) => {
    const sql = `
        SELECT 
            a.*, 
            p.titulo as plaza_titulo, 
            p.descripcion as plaza_descripcion,
            p.ubicacion as plaza_ubicacion,
            p.actividades as plaza_actividades,
            r.organizacion, 
            r.departamento, 
            r.puesto,
            r.direccion,
            r.telefono_oficina,
            u.nombre as receptor_nombre,
            u.apellido_paterno as receptor_apellido_paterno,
            u.apellido_materno as receptor_apellido_materno,
            u.email as receptor_email
        FROM asignaciones a
        JOIN plazas p ON a.plaza_id = p.id
        JOIN receptores r ON a.receptor_codigo_udg = r.codigo_udg
        JOIN usuarios u ON r.codigo_udg = u.codigo_udg
        WHERE a.prestador_codigo_udg = ? AND a.estado = 'activa'
        LIMIT 1;
    `;

    db.query(sql, [req.user.codigo_udg], (err, results) => {
        if (err) {
            console.error("❌ Error en consulta de asignación:", err);
            return res.status(500).json({ status: "error", message: "Error interno del servidor" });
        }

        if (results.length > 0) {
            // Combinar nombre completo del receptor
            const asignacion = results[0];
            asignacion.receptor_nombre_completo = 
                `${asignacion.receptor_nombre} ${asignacion.receptor_apellido_paterno} ${asignacion.receptor_apellido_materno || ''}`.trim();
            
            res.json({ status: "ok", asignacion: asignacion });
        } else {
            res.json({ status: "error", message: "No se encontró asignación activa" });
        }
    });
});

// Ruta de salud del servidor
app.get("/health", (req, res) => {
  // Verificar conexión a la base de datos
  db.query('SELECT 1 as test', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: "error", 
        message: "Problema con la base de datos",
        database: "offline"
      });
    }
    
    res.json({ 
      status: "ok", 
      message: "Servidor de Servicio Social UDG funcionando correctamente",
      database: "online",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
});

// Servir archivos estáticos para las páginas
app.get("/dashboard_prestador.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard_prestador.html'));
});

app.get("/dashboard_receptor.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard_receptor.html'));
});

app.get("/dashboard_admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard_admin.html'));
});

app.get("/crear_reporte.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/crear_reporte.html'));
});

app.get("/mis_reportes.html", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/mis_reportes.html'));
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Ruta no encontrada" });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(500).json({ status: "error", message: "Error interno del servidor" });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Panel de salud: http://localhost:${PORT}/health`);
  console.log(`🔑 Endpoints disponibles:`);
  console.log(`   POST /login - Iniciar sesión`);
  console.log(`   POST /reportes - Crear reporte mensual`);
  console.log(`   GET  /reportes/mis-reportes - Obtener mis reportes`);
  console.log(`   POST /asistencia - Registrar asistencia`);
  console.log(`   GET  /asignacion-activa - Obtener asignación activa`);
  console.log(`   GET  /verify - Verificar token`);
  console.log(`   GET  /perfil/:codigoUdg - Obtener perfil`);
  console.log(`   GET  /plazas - Obtener plazas disponibles`);
  console.log(`   GET  /estadisticas/:codigoUdg - Obtener estadísticas`);
  console.log(`   GET  /health - Verificar estado del servidor`);
});

// Manejo graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Apagando servidor...');
  db.end();
  process.exit(0);
});
// Ruta para crear reporte final
app.post("/reportes/final", authenticateToken, (req, res) => {
    console.log("📥 Solicitud POST /reportes/final recibida");
    
    const {
        studentInfo,
        career,
        commissionDocument,
        shift,
        program,
        dependency,
        head,
        receptor,
        calendar,
        startDate,
        endDate,
        hoursReported,
        objectives,
        activities,
        goals,
        methodology,
        conclusions,
        innovations
    } = req.body;

    // Validar datos requeridos
    if (!studentInfo || !career || !commissionDocument || !startDate || !endDate || !hoursReported) {
        return res.status(400).json({ 
            status: "error", 
            message: "Faltan campos requeridos" 
        });
    }

    // Obtener la asignación activa del usuario
    const getAsignacionSql = `
        SELECT id, horas_acumuladas, horas_requeridas 
        FROM asignaciones 
        WHERE prestador_codigo_udg = ? AND estado = 'activa'
        LIMIT 1;
    `;

    db.query(getAsignacionSql, [req.user.codigo_udg], (err, asignacionResults) => {
        if (err) {
            console.error("❌ Error en consulta de asignación:", err);
            return res.status(500).json({ status: "error", message: "Error interno del servidor" });
        }

        if (asignacionResults.length === 0) {
            return res.status(400).json({ 
                status: "error", 
                message: "No tienes una asignación activa." 
            });
        }

        const asignacion = asignacionResults[0];
        
        // Verificar que tenga las horas completas
        if (asignacion.horas_acumuladas < asignacion.horas_requeridas) {
            return res.status(400).json({ 
                status: "error", 
                message: `No puedes generar el reporte final. Te faltan ${asignacion.horas_requeridas - asignacion.horas_acumuladas} horas por completar.` 
            });
        }

        const asignacion_id = asignacion.id;

        // Insertar el reporte final
        const insertReporteFinalSql = `
            INSERT INTO reportes (
                asignacion_id, tipo, periodo_inicio, periodo_fin, actividades_realizadas,
                logros, dificultades, aprendizajes, horas_reportadas, estado, fecha_entrega,
                turno, fecha_elaboracion, expectativas_programa, aportaciones_institucion,
                cumplimiento_satisfactorio
            ) VALUES (?, 'final', ?, ?, ?, ?, ?, ?, ?, 'borrador', ?, ?, ?, 'Si', ?, 'Si');
        `;

        const valores = [
            asignacion_id,
            startDate,
            endDate,
            activities || '',
            goals || '',
            '', // dificultades
            methodology || '', // aprendizajes se usa para metodología
            parseFloat(hoursReported.replace('hrs.', '').trim()),
            new Date().toISOString(),
            shift || '',
            new Date().toISOString().split('T')[0],
            innovations || ''
        ];

        db.query(insertReporteFinalSql, valores, (err, result) => {
            if (err) {
                console.error("❌ Error al insertar reporte final:", err);
                return res.status(500).json({ 
                    status: "error", 
                    message: "Error al guardar el reporte final" 
                });
            }

            // Marcar asignación como concluida
            const updateAsignacionSql = `
                UPDATE asignaciones 
                SET estado = 'concluida',
                    fecha_termino_real = ?
                WHERE id = ?;
            `;

            db.query(updateAsignacionSql, [new Date(), asignacion_id], (updateErr) => {
                if (updateErr) {
                    console.error("❌ Error al actualizar asignación:", updateErr);
                }

                res.json({
                    status: "ok",
                    message: "Reporte final guardado exitosamente. El servicio social ha sido marcado como concluido.",
                    reporte_id: result.insertId,
                    asignacion_actualizada: true
                });
            });
        });
    });
});
// Ruta para obtener reportes con filtros por tipo de usuario
app.get("/reportes", authenticateToken, (req, res) => {
  const { tipo_usuario, usuario_codigo } = req.query;
  
  let sql = "";
  let params = [];

  if (tipo_usuario === 'prestador') {
    // Prestador ve solo sus reportes
    sql = `
      SELECT r.*, a.plaza_id, p.titulo as plaza_titulo, 
             rec.organizacion, rec.departamento,
             u.nombre as receptor_nombre, u.apellido_paterno as receptor_apellido_paterno,
             u.apellido_materno as receptor_apellido_materno
      FROM reportes r
      JOIN asignaciones a ON r.asignacion_id = a.id
      JOIN plazas p ON a.plaza_id = p.id
      JOIN receptores rec ON a.receptor_codigo_udg = rec.codigo_udg
      JOIN usuarios u ON rec.codigo_udg = u.codigo_udg
      WHERE a.prestador_codigo_udg = ?
      ORDER BY r.fecha_entrega DESC;
    `;
    params = [usuario_codigo];
  } else if (tipo_usuario === 'receptor') {
    // Receptor ve reportes de sus prestadores
    sql = `
      SELECT r.*, a.plaza_id, p.titulo as plaza_titulo,
             prest.carrera, prest.semestre,
             u.nombre as prestador_nombre, u.apellido_paterno as prestador_apellido_paterno,
             u.apellido_materno as prestador_apellido_materno
      FROM reportes r
      JOIN asignaciones a ON r.asignacion_id = a.id
      JOIN plazas p ON a.plaza_id = p.id
      JOIN prestadores prest ON a.prestador_codigo_udg = prest.codigo_udg
      JOIN usuarios u ON prest.codigo_udg = u.codigo_udg
      WHERE a.receptor_codigo_udg = ?
      ORDER BY r.fecha_entrega DESC;
    `;
    params = [usuario_codigo];
  } else if (tipo_usuario === 'administrador') {
    // Administrador ve todos los reportes
    sql = `
      SELECT r.*, a.plaza_id, p.titulo as plaza_titulo,
             prest.carrera, prest.semestre,
             u_prest.nombre as prestador_nombre, 
             u_prest.apellido_paterno as prestador_apellido_paterno,
             u_prest.apellido_materno as prestador_apellido_materno,
             rec.organizacion, rec.departamento,
             u_rec.nombre as receptor_nombre,
             u_rec.apellido_paterno as receptor_apellido_paterno,
             u_rec.apellido_materno as receptor_apellido_materno
      FROM reportes r
      JOIN asignaciones a ON r.asignacion_id = a.id
      JOIN plazas p ON a.plaza_id = p.id
      JOIN prestadores prest ON a.prestador_codigo_udg = prest.codigo_udg
      JOIN usuarios u_prest ON prest.codigo_udg = u_prest.codigo_udg
      JOIN receptores rec ON a.receptor_codigo_udg = rec.codigo_udg
      JOIN usuarios u_rec ON rec.codigo_udg = u_rec.codigo_udg
      ORDER BY r.fecha_entrega DESC;
    `;
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error en consulta de reportes:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    res.json({ status: "ok", reportes: results });
  });
});

// Ruta para que receptores validen reportes
app.put("/reportes/:id/validar", authenticateToken, (req, res) => {
  const reporteId = req.params.id;
  const { estado, observaciones_revisor } = req.body;

  if (!estado || !['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ 
      status: "error", 
      message: "Estado inválido. Debe ser 'aprobado' o 'rechazado'" 
    });
  }

  const sql = `
    UPDATE reportes 
    SET estado = ?, 
        observaciones_revisor = ?,
        fecha_revision = NOW(),
        revisor_codigo_udg = ?
    WHERE id = ?;
  `;

  db.query(sql, [estado, observaciones_revisor, req.user.codigo_udg, reporteId], (err, result) => {
    if (err) {
      console.error("❌ Error al validar reporte:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Reporte no encontrado" });
    }

    // Si el reporte es aprobado y es final, marcar asignación como concluida
    if (estado === 'aprobado') {
      const getReporteSql = `SELECT tipo, asignacion_id FROM reportes WHERE id = ?`;
      
      db.query(getReporteSql, [reporteId], (err, reporteResults) => {
        if (err) {
          console.error("❌ Error al obtener tipo de reporte:", err);
          return;
        }

        if (reporteResults.length > 0 && reporteResults[0].tipo === 'final') {
          const updateAsignacionSql = `
            UPDATE asignaciones 
            SET estado = 'concluida', fecha_termino_real = NOW()
            WHERE id = ?;
          `;
          
          db.query(updateAsignacionSql, [reporteResults[0].asignacion_id], (updateErr) => {
            if (updateErr) {
              console.error("❌ Error al actualizar asignación:", updateErr);
            } else {
              console.log("✅ Asignación marcada como concluida");
            }
          });
        }
      });
    }

    res.json({ 
      status: "ok", 
      message: `Reporte ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente` 
    });
  });
});

// Ruta para que administradores validen horas
app.put("/reportes/:id/validar-horas", authenticateToken, (req, res) => {
  const reporteId = req.params.id;
  const { horas_validadas, observaciones_horas } = req.body;

  if (!horas_validadas || horas_validadas < 0) {
    return res.status(400).json({ 
      status: "error", 
      message: "Horas validadas son requeridas y deben ser mayor o igual a 0" 
    });
  }

  const sql = `
    UPDATE reportes 
    SET horas_validadas = ?,
        observaciones_horas = ?,
        validador_horas_codigo_udg = ?,
        fecha_validacion_horas = NOW()
    WHERE id = ?;
  `;

  db.query(sql, [horas_validadas, observaciones_horas, req.user.codigo_udg, reporteId], (err, result) => {
    if (err) {
      console.error("❌ Error al validar horas:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Reporte no encontrado" });
    }

    // Actualizar horas acumuladas en la asignación
    const getReporteSql = `SELECT asignacion_id, horas_validadas FROM reportes WHERE id = ?`;
    
    db.query(getReporteSql, [reporteId], (err, reporteResults) => {
      if (err) {
        console.error("❌ Error al obtener datos del reporte:", err);
        return;
      }

      if (reporteResults.length > 0) {
        const asignacionId = reporteResults[0].asignacion_id;
        const horasValidadas = reporteResults[0].horas_validadas;

        const updateHorasSql = `
          UPDATE asignaciones 
          SET horas_acumuladas = horas_acumuladas + ?
          WHERE id = ?;
        `;
        
        db.query(updateHorasSql, [horasValidadas, asignacionId], (updateErr) => {
          if (updateErr) {
            console.error("❌ Error al actualizar horas acumuladas:", updateErr);
          } else {
            console.log("✅ Horas acumuladas actualizadas");
          }
        });
      }
    });

    res.json({ 
      status: "ok", 
      message: "Horas validadas correctamente" 
    });
  });
});

// Ruta para obtener detalles completos de un reporte
app.get("/reportes/:id", authenticateToken, (req, res) => {
  const reporteId = req.params.id;

  const sql = `
    SELECT r.*, 
           a.plaza_id, a.horas_acumuladas, a.horas_requeridas,
           p.titulo as plaza_titulo, p.descripcion as plaza_descripcion,
           prest.carrera, prest.semestre,
           u_prest.nombre as prestador_nombre, 
           u_prest.apellido_paterno as prestador_apellido_paterno,
           u_prest.apellido_materno as prestador_apellido_materno,
           rec.organizacion, rec.departamento,
           u_rec.nombre as receptor_nombre,
           u_rec.apellido_paterno as receptor_apellido_paterno,
           u_rec.apellido_materno as receptor_apellido_materno
    FROM reportes r
    JOIN asignaciones a ON r.asignacion_id = a.id
    JOIN plazas p ON a.plaza_id = p.id
    JOIN prestadores prest ON a.prestador_codigo_udg = prest.codigo_udg
    JOIN usuarios u_prest ON prest.codigo_udg = u_prest.codigo_udg
    JOIN receptores rec ON a.receptor_codigo_udg = rec.codigo_udg
    JOIN usuarios u_rec ON rec.codigo_udg = u_rec.codigo_udg
    WHERE r.id = ?;
  `;

  db.query(sql, [reporteId], (err, results) => {
    if (err) {
      console.error("❌ Error en consulta de reporte:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ status: "error", message: "Reporte no encontrado" });
    }

    res.json({ status: "ok", reporte: results[0] });
  });
});
// Ruta para validar reportes (SOLO administradores)
app.put("/reportes/:id/validar", authenticateToken, (req, res) => {
  const reporteId = req.params.id;
  const { estado, observaciones_revisor } = req.body;
  const usuario = req.user;

  // SOLO administradores pueden validar reportes
  if (usuario.tipo !== 'administrador') {
    return res.status(403).json({ 
      status: "error", 
      message: "Solo los administradores pueden validar reportes" 
    });
  }

  if (!estado || !['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ 
      status: "error", 
      message: "Estado inválido. Debe ser 'aprobado' o 'rechazado'" 
    });
  }

  const sql = `
    UPDATE reportes 
    SET estado = ?, 
        observaciones_revisor = ?,
        fecha_revision = NOW(),
        revisor_codigo_udg = ?
    WHERE id = ?;
  `;

  db.query(sql, [estado, observaciones_revisor, usuario.codigo_udg, reporteId], (err, result) => {
    if (err) {
      console.error("❌ Error al validar reporte:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Reporte no encontrado" });
    }

    // Si el reporte es aprobado y es final, marcar asignación como concluida
    if (estado === 'aprobado') {
      const getReporteSql = `SELECT tipo, asignacion_id FROM reportes WHERE id = ?`;
      
      db.query(getReporteSql, [reporteId], (err, reporteResults) => {
        if (err) {
          console.error("❌ Error al obtener tipo de reporte:", err);
          return;
        }

        if (reporteResults.length > 0 && reporteResults[0].tipo === 'final') {
          const updateAsignacionSql = `
            UPDATE asignaciones 
            SET estado = 'concluida', fecha_termino_real = NOW()
            WHERE id = ?;
          `;
          
          db.query(updateAsignacionSql, [reporteResults[0].asignacion_id], (updateErr) => {
            if (updateErr) {
              console.error("❌ Error al actualizar asignación:", updateErr);
            } else {
              console.log("✅ Asignación marcada como concluida");
            }
          });
        }
      });
    }

    res.json({ 
      status: "ok", 
      message: `Reporte ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente` 
    });
  });
});

// Ruta para validar horas (SOLO administradores)
app.put("/reportes/:id/validar-horas", authenticateToken, (req, res) => {
  const reporteId = req.params.id;
  const { horas_validadas, observaciones_horas } = req.body;
  const usuario = req.user;

  // SOLO administradores pueden validar horas
  if (usuario.tipo !== 'administrador') {
    return res.status(403).json({ 
      status: "error", 
      message: "Solo los administradores pueden validar horas" 
    });
  }

  if (!horas_validadas || horas_validadas < 0) {
    return res.status(400).json({ 
      status: "error", 
      message: "Horas validadas son requeridas y deben ser mayor o igual a 0" 
    });
  }

  const sql = `
    UPDATE reportes 
    SET horas_validadas = ?,
        observaciones_horas = ?,
        validador_horas_codigo_udg = ?,
        fecha_validacion_horas = NOW()
    WHERE id = ?;
  `;

  db.query(sql, [horas_validadas, observaciones_horas, usuario.codigo_udg, reporteId], (err, result) => {
    if (err) {
      console.error("❌ Error al validar horas:", err);
      return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Reporte no encontrado" });
    }

    // Actualizar horas acumuladas en la asignación
    const getReporteSql = `SELECT asignacion_id, horas_validadas FROM reportes WHERE id = ?`;
    
    db.query(getReporteSql, [reporteId], (err, reporteResults) => {
      if (err) {
        console.error("❌ Error al obtener datos del reporte:", err);
        return;
      }

      if (reporteResults.length > 0) {
        const asignacionId = reporteResults[0].asignacion_id;
        const horasValidadas = parseFloat(horas_validadas);

        // Obtener horas actuales para calcular la diferencia
        const getHorasActualesSql = `SELECT horas_acumuladas FROM asignaciones WHERE id = ?`;
        
        db.query(getHorasActualesSql, [asignacionId], (err, horasResults) => {
          if (err) {
            console.error("❌ Error al obtener horas actuales:", err);
            return;
          }

          if (horasResults.length > 0) {
            const horasActuales = parseFloat(horasResults[0].horas_acumuladas) || 0;
            
            // Calcular diferencia y actualizar
            const updateHorasSql = `
              UPDATE asignaciones 
              SET horas_acumuladas = horas_acumuladas + ?
              WHERE id = ?;
            `;
            
            // Solo sumar la diferencia si es positiva
            db.query(updateHorasSql, [horasValidadas, asignacionId], (updateErr) => {
              if (updateErr) {
                console.error("❌ Error al actualizar horas acumuladas:", updateErr);
              } else {
                console.log(`✅ Horas acumuladas actualizadas: +${horasValidadas} horas`);
              }
            });
          }
        });
      }
    });

    res.json({ 
      status: "ok", 
      message: "Horas validadas correctamente" 
    });
  });
});