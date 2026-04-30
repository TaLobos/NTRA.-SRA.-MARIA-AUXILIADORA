-- =============================================================
-- Schema para Ntra. Sra. María Auxiliadora — Gestión de Stock
-- Base de datos: Supabase (PostgreSQL)
-- =============================================================

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id               BIGSERIAL PRIMARY KEY,
    nombre           VARCHAR(255)   NOT NULL,
    descripcion      TEXT,
    precio           NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock_quantity   INTEGER        NOT NULL DEFAULT 0,
    CONSTRAINT chk_stock_no_negativo CHECK (stock_quantity >= 0)
);

-- Tabla: usuarios
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'CLIENTE');

CREATE TABLE IF NOT EXISTS usuarios (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL,
    apellido        VARCHAR(100)  NOT NULL,
    organizacion    VARCHAR(255),
    pais            VARCHAR(100)  NOT NULL,
    provincia       VARCHAR(100)  NOT NULL,
    ciudad          VARCHAR(100)  NOT NULL,
    direccion       VARCHAR(255)  NOT NULL,
    codigo_postal   VARCHAR(20)   NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    telefono        VARCHAR(30),
    rol             rol_usuario   NOT NULL DEFAULT 'CLIENTE'
);

-- Tabla: pedidos
CREATE TYPE estado_pedido AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO');

CREATE TABLE IF NOT EXISTS pedidos (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado      estado_pedido  NOT NULL DEFAULT 'PENDIENTE',
    fecha       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Tabla: detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id          BIGSERIAL PRIMARY KEY,
    pedido_id   BIGINT  NOT NULL REFERENCES pedidos(id)   ON DELETE CASCADE,
    producto_id BIGINT  NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario    ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id ON detalles_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalles_producto  ON detalles_pedido(producto_id);
