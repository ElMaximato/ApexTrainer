-- Esquema MySQL de APEX Personal Training.
-- El servidor ejecuta este archivo solo al arrancar (es seguro repetirlo: usa IF NOT EXISTS).
-- Si prefieres hacerlo a mano en MySQL Workbench:
--   1) CREATE DATABASE apex_trainer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2) USE apex_trainer;
--   3) Pega y ejecuta el resto de este archivo.

CREATE TABLE IF NOT EXISTS usuarios (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre                 VARCHAR(60)  NOT NULL,
  email                  VARCHAR(120) NOT NULL,
  password_hash          VARCHAR(255) NOT NULL,
  edad                   INT NULL,
  altura_cm              INT NULL,
  peso_kg                DECIMAL(5,1) NULL,
  objetivo               VARCHAR(40)  NOT NULL DEFAULT 'Ganar masa muscular',
  ciudad                 VARCHAR(60)  NOT NULL DEFAULT 'Hermosillo',
  privacidad_aceptada_en VARCHAR(40)  NOT NULL,
  creado_en              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ejercicios (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  grupo_muscular VARCHAR(40)  NOT NULL,
  series_reps    VARCHAR(40)  NOT NULL,
  peso_sugerido  VARCHAR(40)  NOT NULL DEFAULT '',
  descanso       VARCHAR(40)  NOT NULL DEFAULT '',
  tecnica        TEXT         NOT NULL,
  imagen_url     VARCHAR(500) NOT NULL DEFAULT '',
  UNIQUE KEY uq_ejercicios_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rutinas (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  grupo_muscular VARCHAR(40)  NOT NULL,
  subtitulo      VARCHAR(160) NOT NULL DEFAULT '',
  dia            VARCHAR(20)  NOT NULL,
  duracion_min   INT NOT NULL DEFAULT 45,
  nivel          VARCHAR(30)  NOT NULL DEFAULT 'Intermedio',
  imagen_url     VARCHAR(500) NOT NULL DEFAULT '',
  orden          INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_rutinas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rutina_ejercicios (
  rutina_id    INT UNSIGNED NOT NULL,
  ejercicio_id INT UNSIGNED NOT NULL,
  orden        INT NOT NULL DEFAULT 0,
  PRIMARY KEY (rutina_id, ejercicio_id),
  CONSTRAINT fk_re_rutina    FOREIGN KEY (rutina_id)    REFERENCES rutinas(id)    ON DELETE CASCADE,
  CONSTRAINT fk_re_ejercicio FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesiones (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  rutina_id    INT UNSIGNED NOT NULL,
  duracion_min INT NOT NULL,
  kcal         INT NOT NULL,
  fecha        DATE NOT NULL,
  INDEX idx_sesiones_usuario_fecha (usuario_id, fecha),
  CONSTRAINT fk_ses_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ses_rutina  FOREIGN KEY (rutina_id)  REFERENCES rutinas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
