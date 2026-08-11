-- CreateEnum
CREATE TYPE "MotivoReporte" AS ENUM ('PRECIO_ABUSIVO', 'INFORMACION_FALSA', 'NO_EXISTE', 'NO_RESPONDE', 'TRATO_IRRESPETUOSO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'ATENDIDO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "motivo" "MotivoReporte" NOT NULL,
    "detalle" TEXT NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendidoEn" TIMESTAMP(3),
    "notaAdmin" TEXT,
    "autorId" TEXT NOT NULL,
    "inmuebleId" TEXT NOT NULL,
    "atendidoPorId" TEXT,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioDePrecio" (
    "id" TEXT NOT NULL,
    "precioAnterior" INTEGER NOT NULL,
    "precioNuevo" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inmuebleId" TEXT NOT NULL,

    CONSTRAINT "CambioDePrecio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reporte_estado_creadoEn_idx" ON "Reporte"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "Reporte_inmuebleId_idx" ON "Reporte"("inmuebleId");

-- CreateIndex
CREATE UNIQUE INDEX "Reporte_autorId_inmuebleId_key" ON "Reporte"("autorId", "inmuebleId");

-- CreateIndex
CREATE INDEX "CambioDePrecio_inmuebleId_creadoEn_idx" ON "CambioDePrecio"("inmuebleId", "creadoEn");

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioDePrecio" ADD CONSTRAINT "CambioDePrecio_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;
