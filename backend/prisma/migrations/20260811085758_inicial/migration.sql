-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'ARRENDADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoInmueble" AS ENUM ('HABITACION', 'APARTAESTUDIO', 'APARTAMENTO', 'CASA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inmueble" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoInmueble" NOT NULL,
    "precio" INTEGER NOT NULL,
    "barrio" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "habitaciones" INTEGER NOT NULL DEFAULT 1,
    "banos" INTEGER NOT NULL DEFAULT 1,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amoblado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "arrendadorId" TEXT NOT NULL,

    CONSTRAINT "Inmueble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoInmueble" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "inmuebleId" TEXT NOT NULL,

    CONSTRAINT "FotoInmueble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resena" (
    "id" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "arrendadorId" TEXT NOT NULL,
    "inmuebleId" TEXT,

    CONSTRAINT "Resena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudContacto" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudContacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Inmueble_arrendadorId_idx" ON "Inmueble"("arrendadorId");

-- CreateIndex
CREATE INDEX "Inmueble_activo_precio_idx" ON "Inmueble"("activo", "precio");

-- CreateIndex
CREATE INDEX "Inmueble_tipo_idx" ON "Inmueble"("tipo");

-- CreateIndex
CREATE INDEX "Inmueble_barrio_idx" ON "Inmueble"("barrio");

-- CreateIndex
CREATE INDEX "FotoInmueble_inmuebleId_idx" ON "FotoInmueble"("inmuebleId");

-- CreateIndex
CREATE INDEX "Favorito_usuarioId_idx" ON "Favorito"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_inmuebleId_key" ON "Favorito"("usuarioId", "inmuebleId");

-- CreateIndex
CREATE INDEX "Resena_arrendadorId_idx" ON "Resena"("arrendadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Resena_autorId_arrendadorId_key" ON "Resena"("autorId", "arrendadorId");

-- CreateIndex
CREATE INDEX "SolicitudContacto_inmuebleId_idx" ON "SolicitudContacto"("inmuebleId");

-- CreateIndex
CREATE INDEX "SolicitudContacto_estudianteId_idx" ON "SolicitudContacto"("estudianteId");

-- AddForeignKey
ALTER TABLE "Inmueble" ADD CONSTRAINT "Inmueble_arrendadorId_fkey" FOREIGN KEY ("arrendadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoInmueble" ADD CONSTRAINT "FotoInmueble_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resena" ADD CONSTRAINT "Resena_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resena" ADD CONSTRAINT "Resena_arrendadorId_fkey" FOREIGN KEY ("arrendadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resena" ADD CONSTRAINT "Resena_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudContacto" ADD CONSTRAINT "SolicitudContacto_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudContacto" ADD CONSTRAINT "SolicitudContacto_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;
