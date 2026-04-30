# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — Ntra. Sra. María Auxiliadora — Stock API
# Diseñado para desplegar en Render o Railway.
# ──────────────────────────────────────────────────────────────────────────────

# ── Etapa 1: build ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copiar descriptor de proyecto y descargar dependencias (capa cacheada)
COPY pom.xml .
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Copiar el código fuente y compilar
COPY src ./src
RUN mvn package -DskipTests -B

# ── Etapa 2: runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar el JAR generado
COPY --from=build /app/target/*.jar app.jar

# Puerto de escucha (configurable con la variable PORT en Render/Railway)
EXPOSE 8080

# Variables de entorno esperadas (se configuran en el panel de Render/Railway):
#   DB_URL, DB_USERNAME, DB_PASSWORD, CORS_ALLOWED_ORIGIN, PORT

ENTRYPOINT ["java", "-jar", "app.jar"]
