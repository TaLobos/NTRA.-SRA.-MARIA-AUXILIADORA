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

CREATE TABLE IF NOT EXISTS producto_fotos (
    producto_id BIGINT       NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    posicion    INTEGER      NOT NULL,
    url         VARCHAR(500) NOT NULL,
    PRIMARY KEY (producto_id, posicion)
);

CREATE TABLE IF NOT EXISTS producto_caracteristicas (
    producto_id    BIGINT       NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    posicion       INTEGER      NOT NULL,
    caracteristica VARCHAR(500) NOT NULL,
    PRIMARY KEY (producto_id, posicion)
);

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
    rol             VARCHAR(10)   NOT NULL DEFAULT 'CLIENTE',
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('ADMIN', 'CLIENTE'))
);

CREATE TABLE IF NOT EXISTS pedidos (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado      VARCHAR(15)    NOT NULL DEFAULT 'PENDIENTE',
    fecha       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_pedido_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADO', 'RECHAZADO'))
);

-- Tabla: detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id          BIGSERIAL PRIMARY KEY,
    pedido_id   BIGINT  NOT NULL REFERENCES pedidos(id)   ON DELETE CASCADE,
    producto_id BIGINT  NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    CONSTRAINT uk_detalles_pedido_producto UNIQUE (pedido_id, producto_id)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario    ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id ON detalles_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalles_producto  ON detalles_pedido(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_fotos_producto ON producto_fotos(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_caracteristicas_producto ON producto_caracteristicas(producto_id);

-- Seguridad Supabase: el frontend consume el backend Spring, no la Data API directa.
-- RLS queda habilitado sin policies publicas para no exponer tablas por REST.
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_caracteristicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;

-- Storage: bucket publico para URLs de imagenes, con escritura solo para admins.
-- La autorizacion cruza el email del JWT de Supabase Auth contra public.usuarios.
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.is_admin_email()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
      AND u.rol = 'ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION app_private.is_admin_email() FROM public;
GRANT EXECUTE ON FUNCTION app_private.is_admin_email() TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;

CREATE POLICY "Admin can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin_email());

CREATE POLICY "Admin can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND app_private.is_admin_email())
WITH CHECK (bucket_id = 'product-images' AND app_private.is_admin_email());

CREATE POLICY "Admin can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND app_private.is_admin_email());
