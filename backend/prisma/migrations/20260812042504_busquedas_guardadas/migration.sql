-- CreateTable
CREATE TABLE "BusquedaGuardada" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "avisarPorCorreo" BOOLEAN NOT NULL DEFAULT true,
    "q" TEXT,
    "tipo" "TipoInmueble",
    "barrio" TEXT,
    "precioMin" INTEGER,
    "precioMax" INTEGER,
    "habitaciones" INTEGER,
    "amoblado" BOOLEAN,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revisadaHasta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAvisoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "BusquedaGuardada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusquedaGuardada_usuarioId_idx" ON "BusquedaGuardada"("usuarioId");

-- CreateIndex
CREATE INDEX "BusquedaGuardada_avisarPorCorreo_idx" ON "BusquedaGuardada"("avisarPorCorreo");

-- AddForeignKey
ALTER TABLE "BusquedaGuardada" ADD CONSTRAINT "BusquedaGuardada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
