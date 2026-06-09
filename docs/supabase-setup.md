# Supabase setup

## Backend

Variables necesarias para Spring Boot:

```env
DB_URL=jdbc:postgresql://...
DB_USERNAME=postgres...
DB_PASSWORD=...
SUPABASE_URL=https://irpiajmuatxmjgqozanh.supabase.co
SUPABASE_JWT_ISSUER=https://irpiajmuatxmjgqozanh.supabase.co/auth/v1
SUPABASE_JWKS_URI=https://irpiajmuatxmjgqozanh.supabase.co/auth/v1/.well-known/jwks.json
ADMIN_USERNAME=tomas.alberto.lobos123@gmail.com
ADMIN_PASSWORD=juegos13
```

El backend acepta:

- `Authorization: Bearer <access_token>` de Supabase Auth.
- HTTP Basic con `ADMIN_USERNAME` y `ADMIN_PASSWORD` como fallback local.

El rol real se toma de `public.usuarios` por email. Para admin debe existir:

```text
tomas.alberto.lobos123@gmail.com -> ADMIN
```

## Frontend

Completar `frontend/config.js` con la publishable/anon key de Supabase:

```js
supabaseAnonKey: "..."
```

No usar nunca `service_role` en el frontend.

## Auth

Para usar login Supabase, crear el usuario en Supabase Auth con:

```text
email: tomas.alberto.lobos123@gmail.com
password: juegos13
```

La fila ADMIN en `public.usuarios` ya existe y es la que autoriza endpoints admin y uploads.

## Storage

Bucket:

```text
product-images
```

El bucket es publico para servir imagenes por URL. Las policies permiten subir, actualizar y borrar solo a usuarios autenticados cuyo email sea ADMIN en `public.usuarios`.

## SMTP

Supabase Auth puede enviar mails con SMTP propio, pero requiere credenciales de proveedor:

```text
SMTP host
SMTP port
SMTP user
SMTP password
Sender email
Sender name
```

Eso se carga en Supabase Dashboard > Authentication > Email, o por Management API con token de Supabase. No debe guardarse en este repositorio.
