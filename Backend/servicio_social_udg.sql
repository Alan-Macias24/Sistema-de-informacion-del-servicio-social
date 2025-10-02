-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 01-10-2025 a las 17:09:08
-- Versión del servidor: 9.1.0
-- Versión de PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `servicio_social_udg`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `actividades_diarias`
--

DROP TABLE IF EXISTS `actividades_diarias`;
CREATE TABLE IF NOT EXISTS `actividades_diarias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asignacion_id` int NOT NULL,
  `fecha` date NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `horas_invertidas` decimal(4,2) NOT NULL,
  `evidencias` json DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asignacion_id` (`asignacion_id`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `actividades_diarias`
--

INSERT INTO `actividades_diarias` (`id`, `asignacion_id`, `fecha`, `descripcion`, `horas_invertidas`, `evidencias`, `fecha_registro`) VALUES
(1, 1, '2025-09-28', 'Desarrollo del formulario de login con validaciones', 2.00, NULL, '2025-09-30 03:24:18'),
(2, 1, '2025-09-28', 'Implementación de autenticación JWT en el backend', 2.00, NULL, '2025-09-30 03:24:18'),
(3, 2, '2025-09-28', 'Limpieza interna de 8 equipos de cómputo', 2.50, NULL, '2025-09-30 03:24:18'),
(4, 2, '2025-09-28', 'Actualización de sistema operativo en 5 equipos', 1.50, NULL, '2025-09-30 03:24:18'),
(5, 3, '2025-09-28', 'Diseño de interfaz para generación de reportes PDF', 3.00, NULL, '2025-09-30 03:24:18'),
(6, 3, '2025-09-28', 'Configuración de servidor de base de datos', 1.00, NULL, '2025-09-30 03:24:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignaciones`
--

DROP TABLE IF EXISTS `asignaciones`;
CREATE TABLE IF NOT EXISTS `asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prestador_codigo_udg` bigint UNSIGNED NOT NULL,
  `plaza_id` int NOT NULL,
  `receptor_codigo_udg` bigint UNSIGNED NOT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` date NOT NULL,
  `fecha_termino_estimada` date NOT NULL,
  `fecha_termino_real` date DEFAULT NULL,
  `horas_acumuladas` int DEFAULT '0',
  `horas_requeridas` int DEFAULT '480',
  `estado` enum('activa','concluida','cancelada','suspendida') COLLATE utf8mb4_unicode_ci DEFAULT 'activa',
  `oficio_comision` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oficio_comision` (`oficio_comision`),
  UNIQUE KEY `unique_prestador_activo` (`prestador_codigo_udg`,`estado`),
  KEY `plaza_id` (`plaza_id`),
  KEY `receptor_codigo_udg` (`receptor_codigo_udg`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_inicio` (`fecha_inicio`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asignaciones`
--

INSERT INTO `asignaciones` (`id`, `prestador_codigo_udg`, `plaza_id`, `receptor_codigo_udg`, `fecha_asignacion`, `fecha_inicio`, `fecha_termino_estimada`, `fecha_termino_real`, `horas_acumuladas`, `horas_requeridas`, `estado`, `oficio_comision`, `observaciones`) VALUES
(1, 2212345678, 1, 3000000001, '2025-09-30 03:24:18', '2025-01-15', '2025-08-15', NULL, 120, 480, 'activa', 'OFICIO-SS-2025-001', NULL),
(2, 2212345679, 3, 3000000003, '2025-09-30 03:24:18', '2025-02-01', '2025-09-01', NULL, 240, 480, 'activa', 'OFICIO-SS-2025-002', NULL),
(3, 2212345680, 1, 3000000001, '2025-09-30 03:24:18', '2025-01-15', '2025-08-15', NULL, 360, 480, 'activa', 'OFICIO-SS-2025-003', NULL),
(4, 2212345681, 2, 3000000002, '2025-09-30 03:24:18', '2025-03-01', '2025-10-01', NULL, 80, 480, 'activa', 'OFICIO-SS-2025-004', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
CREATE TABLE IF NOT EXISTS `asistencia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asignacion_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `hora_salida` time DEFAULT NULL,
  `horas_realizadas` decimal(4,2) DEFAULT '0.00',
  `actividades_realizadas` text COLLATE utf8mb4_unicode_ci,
  `evidencia_foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacion_lat` decimal(10,8) DEFAULT NULL,
  `ubicacion_lng` decimal(11,8) DEFAULT NULL,
  `estado` enum('registrada','validada','rechazada') COLLATE utf8mb4_unicode_ci DEFAULT 'registrada',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_asistencia_dia` (`asignacion_id`,`fecha`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asistencia`
--

INSERT INTO `asistencia` (`id`, `asignacion_id`, `fecha`, `hora_entrada`, `hora_salida`, `horas_realizadas`, `actividades_realizadas`, `evidencia_foto`, `ubicacion_lat`, `ubicacion_lng`, `estado`, `observaciones`, `fecha_registro`) VALUES
(1, 1, '2025-09-28', '09:00:00', '13:00:00', 4.00, 'Desarrollo de módulo de login y autenticación', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(2, 1, '2025-09-27', '09:15:00', '13:30:00', 4.25, 'Diseño de interfaz de usuario', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(3, 1, '2025-09-24', '08:45:00', '12:45:00', 4.00, 'Pruebas de funcionalidad del sistema', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(4, 2, '2025-09-28', '08:30:00', '12:30:00', 4.00, 'Mantenimiento preventivo a 15 equipos', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(5, 2, '2025-09-26', '09:00:00', '13:00:00', 4.00, 'Instalación de software en laboratorio 2', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(6, 2, '2025-09-23', '08:00:00', '12:00:00', 4.00, 'Diagnóstico de fallas en equipos', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(7, 3, '2025-09-28', '10:00:00', '14:00:00', 4.00, 'Desarrollo de módulo de reportes', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18'),
(8, 3, '2025-09-25', '10:30:00', '14:30:00', 4.00, 'Optimización de consultas a base de datos', NULL, NULL, NULL, 'validada', NULL, '2025-09-30 03:24:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones`
--

DROP TABLE IF EXISTS `configuraciones`;
CREATE TABLE IF NOT EXISTS `configuraciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuraciones`
--

INSERT INTO `configuraciones` (`id`, `clave`, `valor`, `descripcion`, `tipo`, `fecha_actualizacion`) VALUES
(1, 'horas_requeridas_servicio', '480', 'Número total de horas requeridas para el servicio social', 'number', '2025-09-30 00:56:38'),
(2, 'porcentaje_minimo_creditos', '60', 'Porcentaje mínimo de créditos para iniciar servicio social', 'number', '2025-09-30 00:56:38'),
(3, 'dias_vencimiento_reportes', '60', 'Días para vencimiento de reportes bimestrales', 'number', '2025-09-30 00:56:38'),
(4, 'limite_horas_diarias', '8', 'Límite máximo de horas por día', 'number', '2025-09-30 00:56:38'),
(5, 'maximo_horas_semana', '40', 'Límite máximo de horas por semana', 'number', '2025-09-30 00:56:38'),
(6, 'dias_aviso_vencimiento', '7', 'Días de aviso previo al vencimiento de reportes', 'number', '2025-09-30 00:56:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documentos`
--

DROP TABLE IF EXISTS `documentos`;
CREATE TABLE IF NOT EXISTS `documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asignacion_id` int NOT NULL,
  `tipo` enum('oficio_comision','carta_aceptacion','reporte_bimestral','reporte_final','constancia','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta_archivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamaño` bigint DEFAULT NULL,
  `estado` enum('pendiente','aprobado','rechazado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `revisor_codigo_udg` bigint UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asignacion_id` (`asignacion_id`),
  KEY `revisor_codigo_udg` (`revisor_codigo_udg`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
CREATE TABLE IF NOT EXISTS `mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `remitente_codigo_udg` bigint UNSIGNED NOT NULL,
  `destinatario_codigo_udg` bigint UNSIGNED NOT NULL,
  `asunto` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `leido` tinyint(1) DEFAULT '0',
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_leido` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_remitente` (`remitente_codigo_udg`),
  KEY `idx_destinatario` (`destinatario_codigo_udg`),
  KEY `idx_leido` (`leido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_codigo_udg` bigint UNSIGNED NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('info','alerta','recordatorio','urgente') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `leida` tinyint(1) DEFAULT '0',
  `enlace` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_leida` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_leida` (`usuario_codigo_udg`,`leida`),
  KEY `idx_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plazas`
--

DROP TABLE IF EXISTS `plazas`;
CREATE TABLE IF NOT EXISTS `plazas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `receptor_codigo_udg` bigint UNSIGNED NOT NULL,
  `horas_requeridas` int DEFAULT '480',
  `vacantes` int DEFAULT '1',
  `vacantes_disponibles` int DEFAULT '1',
  `requisitos` text COLLATE utf8mb4_unicode_ci,
  `actividades` text COLLATE utf8mb4_unicode_ci,
  `ubicacion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('disponible','ocupada','inactiva') COLLATE utf8mb4_unicode_ci DEFAULT 'disponible',
  `fecha_publicacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_limite` date DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `receptor_codigo_udg` (`receptor_codigo_udg`),
  KEY `idx_estado` (`estado`),
  KEY `idx_activa` (`activa`),
  KEY `idx_fecha_limite` (`fecha_limite`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plazas`
--

INSERT INTO `plazas` (`id`, `titulo`, `descripcion`, `receptor_codigo_udg`, `horas_requeridas`, `vacantes`, `vacantes_disponibles`, `requisitos`, `actividades`, `ubicacion`, `estado`, `fecha_publicacion`, `fecha_limite`, `activa`) VALUES
(1, 'Desarrollo de Sistema Web', 'Desarrollo de aplicaciones web para gestión interna del departamento', 3000000001, 480, 2, 1, 'Conocimientos en HTML, CSS, JavaScript, Bases de datos', 'Desarrollo frontend y backend, pruebas de software, documentación', 'Edificio de Sistemas - Cubículo 5', 'disponible', '2025-09-30 03:24:18', '2025-12-31', 1),
(2, 'Digitalización de Archivos', 'Digitalización y organización de archivos históricos de la biblioteca', 3000000002, 480, 1, 1, 'Manejo de scanner, organización de documentos, office', 'Escaneo de documentos, clasificación, organización digital', 'Biblioteca Central - Área de Archivos', 'disponible', '2025-09-30 03:24:18', '2025-11-30', 1),
(3, 'Mantenimiento de Equipos de Cómputo', 'Mantenimiento preventivo y correctivo de equipos de laboratorio', 3000000003, 480, 1, 0, 'Conocimientos básicos de hardware, software y redes', 'Limpieza de equipos, instalación de software, diagnóstico de fallas', 'Laboratorio de Computación 3', 'ocupada', '2025-09-30 03:24:18', '2025-10-31', 1),
(4, 'Soporte Técnico a Usuarios', 'Atención y soporte técnico a usuarios del centro de cómputo', 3000000001, 480, 1, 1, 'Conocimientos de sistemas operativos, office, atención al usuario', 'Atención a usuarios, resolución de problemas técnicos, mantenimiento', 'Centro de Cómputo Principal', 'disponible', '2025-09-30 03:24:18', '2026-01-31', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prestadores`
--

DROP TABLE IF EXISTS `prestadores`;
CREATE TABLE IF NOT EXISTS `prestadores` (
  `codigo_udg` bigint UNSIGNED NOT NULL,
  `carrera` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semestre` int NOT NULL,
  `creditos_aprobados` int NOT NULL,
  `porcentaje_creditos` decimal(5,2) NOT NULL,
  `fecha_inicio_carrera` date DEFAULT NULL,
  PRIMARY KEY (`codigo_udg`),
  KEY `idx_carrera` (`carrera`),
  KEY `idx_semestre` (`semestre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `prestadores`
--

INSERT INTO `prestadores` (`codigo_udg`, `carrera`, `semestre`, `creditos_aprobados`, `porcentaje_creditos`, `fecha_inicio_carrera`) VALUES
(2212345678, 'Ingeniería en Computación', 8, 200, 70.00, '2021-08-01'),
(2212345679, 'Ingeniería en Computación', 7, 180, 62.50, '2021-08-01'),
(2212345680, 'Licenciatura en Administración', 9, 220, 75.00, '2020-08-01'),
(2212345681, 'Ingeniería en Electrónica', 6, 150, 55.50, '2022-08-01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `receptores`
--

DROP TABLE IF EXISTS `receptores`;
CREATE TABLE IF NOT EXISTS `receptores` (
  `codigo_udg` bigint UNSIGNED NOT NULL,
  `organizacion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puesto` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `telefono_oficina` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`codigo_udg`),
  KEY `idx_organizacion` (`organizacion`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `receptores`
--

INSERT INTO `receptores` (`codigo_udg`, `organizacion`, `departamento`, `puesto`, `direccion`, `telefono_oficina`, `activo`) VALUES
(3000000001, 'Centro Universitario de la Ciénega', 'Departamento de Sistemas', 'Jefe de Departamento', 'Av. Universidad #111, Ocotlán, Jalisco', '3331112233', 1),
(3000000002, 'Centro Universitario de la Ciénega', 'Biblioteca', 'Coordinador de Biblioteca', 'Av. Universidad #111, Ocotlán, Jalisco', '3332223344', 1),
(3000000003, 'Centro Universitario de la Ciénega', 'Laboratorios de Computación', 'Responsable de Laboratorios', 'Av. Universidad #111, Ocotlán, Jalisco', '3333334455', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

DROP TABLE IF EXISTS `reportes`;
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asignacion_id` int NOT NULL,
  `tipo` enum('bimestral','mensual','final') COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodo_inicio` date NOT NULL,
  `periodo_fin` date NOT NULL,
  `actividades_realizadas` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `logros` text COLLATE utf8mb4_unicode_ci,
  `dificultades` text COLLATE utf8mb4_unicode_ci,
  `aprendizajes` text COLLATE utf8mb4_unicode_ci,
  `horas_reportadas` decimal(5,2) NOT NULL,
  `estado` enum('borrador','en_revision','aprobado','rechazado') COLLATE utf8mb4_unicode_ci DEFAULT 'borrador',
  `fecha_entrega` timestamp NULL DEFAULT NULL,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `observaciones_revisor` text COLLATE utf8mb4_unicode_ci,
  `archivo_evidencia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revisor_codigo_udg` bigint UNSIGNED DEFAULT NULL,
  `turno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_elaboracion` date DEFAULT NULL,
  `expectativas_programa` enum('Si','No') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `porcentaje_conocimientos` int DEFAULT NULL,
  `porcentaje_experiencias` int DEFAULT NULL,
  `porcentaje_profesionales` int DEFAULT NULL,
  `porcentaje_habilidades` int DEFAULT NULL,
  `aportaciones_institucion` text COLLATE utf8mb4_unicode_ci,
  `cumplimiento_satisfactorio` enum('Si','No') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asignacion_id` (`asignacion_id`),
  KEY `revisor_codigo_udg` (`revisor_codigo_udg`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_periodo` (`periodo_inicio`,`periodo_fin`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id`, `asignacion_id`, `tipo`, `periodo_inicio`, `periodo_fin`, `actividades_realizadas`, `logros`, `dificultades`, `aprendizajes`, `horas_reportadas`, `estado`, `fecha_entrega`, `fecha_revision`, `observaciones_revisor`, `archivo_evidencia`, `revisor_codigo_udg`, `turno`, `fecha_elaboracion`, `expectativas_programa`, `porcentaje_conocimientos`, `porcentaje_experiencias`, `porcentaje_profesionales`, `porcentaje_habilidades`, `aportaciones_institucion`, `cumplimiento_satisfactorio`) VALUES
(1, 1, 'bimestral', '2025-01-15', '2025-03-15', 'Desarrollo de módulos de autenticación y gestión de usuarios', 'Sistema de login funcional, base de datos configurada', 'Problemas con la configuración del servidor', 'Aprendí sobre desarrollo fullstack y manejo de JWT', 60.00, 'aprobado', '2025-03-20 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 2, 'bimestral', '2025-02-01', '2025-04-01', 'Mantenimiento preventivo a 45 equipos, instalación de software', 'Todos los equipos del laboratorio 3 optimizados', 'Falta de repuestos para algunos equipos', 'Mejoré mis habilidades en diagnóstico de hardware', 80.00, 'aprobado', '2025-04-05 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 3, 'bimestral', '2025-01-15', '2025-03-15', 'Desarrollo de módulo de reportes y dashboard administrativo', 'Sistema de reportes generando PDF correctamente', 'Complejidad en la generación de gráficos', 'Aprendí a usar librerías de generación de PDF', 75.00, 'en_revision', '2025-03-18 06:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 1, 'mensual', '2025-08-01', '2025-08-31', 'asd', 'asdad', 'asdasd', 'sadasd', 120.00, 'borrador', '2025-09-30 15:42:32', NULL, NULL, NULL, NULL, 'Vespertino', '2025-09-30', 'Si', 13, 45, 80, 45, 'dadsda', 'Si');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `codigo_udg` bigint UNSIGNED NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('administrador','prestador','receptor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`codigo_udg`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_activo` (`activo`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`codigo_udg`, `email`, `password_hash`, `nombre`, `apellido_paterno`, `apellido_materno`, `telefono`, `tipo`, `activo`, `fecha_registro`, `ultimo_login`) VALUES
(1000000001, 'admin@cucienega.udg.mx', '$2b$10$hashedpassword1', 'Carlos', 'Martínez', 'López', '3331234567', 'administrador', 1, '2025-09-30 03:24:18', NULL),
(1000000002, 'coordinador.ss@cucienega.udg.mx', '$2b$10$hashedpassword2', 'Ana', 'García', 'Hernández', '3337654321', 'administrador', 1, '2025-09-30 03:24:18', NULL),
(2212345678, 'juan.perez@alumnos.udg.mx', '$2b$10$hashedpassword3', 'Juan', 'Pérez', 'García', '3311234567', 'prestador', 1, '2025-09-30 03:24:18', NULL),
(2212345679, 'maria.lopez@alumnos.udg.mx', '$2b$10$hashedpassword4', 'María', 'López', 'Rodríguez', '3312345678', 'prestador', 1, '2025-09-30 03:24:18', NULL),
(2212345680, 'pedro.hernandez@alumnos.udg.mx', '$2b$10$hashedpassword5', 'Pedro', 'Hernández', 'Sánchez', '3313456789', 'prestador', 1, '2025-09-30 03:24:18', NULL),
(2212345681, 'laura.gomez@alumnos.udg.mx', '$2b$10$hashedpassword6', 'Laura', 'Gómez', 'Díaz', '3314567890', 'prestador', 1, '2025-09-30 03:24:18', NULL),
(3000000001, 'sistemas@cucienega.udg.mx', '$2b$10$hashedpassword7', 'Roberto', 'Silva', 'Mendoza', '3331112233', 'receptor', 1, '2025-09-30 03:24:18', NULL),
(3000000002, 'biblioteca@cucienega.udg.mx', '$2b$10$hashedpassword8', 'Carmen', 'Vargas', 'Ruiz', '3332223344', 'receptor', 1, '2025-09-30 03:24:18', NULL),
(3000000003, 'laboratorios@cucienega.udg.mx', '$2b$10$hashedpassword9', 'Miguel', 'Torres', 'Castro', '3333334455', 'receptor', 1, '2025-09-30 03:24:18', NULL);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `actividades_diarias`
--
ALTER TABLE `actividades_diarias`
  ADD CONSTRAINT `actividades_diarias_ibfk_1` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `asignaciones`
--
ALTER TABLE `asignaciones`
  ADD CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`prestador_codigo_udg`) REFERENCES `prestadores` (`codigo_udg`),
  ADD CONSTRAINT `asignaciones_ibfk_2` FOREIGN KEY (`plaza_id`) REFERENCES `plazas` (`id`),
  ADD CONSTRAINT `asignaciones_ibfk_3` FOREIGN KEY (`receptor_codigo_udg`) REFERENCES `receptores` (`codigo_udg`);

--
-- Filtros para la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `documentos`
--
ALTER TABLE `documentos`
  ADD CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documentos_ibfk_2` FOREIGN KEY (`revisor_codigo_udg`) REFERENCES `usuarios` (`codigo_udg`);

--
-- Filtros para la tabla `mensajes`
--
ALTER TABLE `mensajes`
  ADD CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`remitente_codigo_udg`) REFERENCES `usuarios` (`codigo_udg`),
  ADD CONSTRAINT `mensajes_ibfk_2` FOREIGN KEY (`destinatario_codigo_udg`) REFERENCES `usuarios` (`codigo_udg`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_codigo_udg`) REFERENCES `usuarios` (`codigo_udg`);

--
-- Filtros para la tabla `plazas`
--
ALTER TABLE `plazas`
  ADD CONSTRAINT `plazas_ibfk_1` FOREIGN KEY (`receptor_codigo_udg`) REFERENCES `receptores` (`codigo_udg`);

--
-- Filtros para la tabla `prestadores`
--
ALTER TABLE `prestadores`
  ADD CONSTRAINT `prestadores_ibfk_1` FOREIGN KEY (`codigo_udg`) REFERENCES `usuarios` (`codigo_udg`) ON DELETE CASCADE;

--
-- Filtros para la tabla `receptores`
--
ALTER TABLE `receptores`
  ADD CONSTRAINT `receptores_ibfk_1` FOREIGN KEY (`codigo_udg`) REFERENCES `usuarios` (`codigo_udg`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`revisor_codigo_udg`) REFERENCES `usuarios` (`codigo_udg`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
