-- CreateEnum
CREATE TYPE "RitmoDeVida" AS ENUM ('MADRUGADOR', 'NOCTURNO', 'MIXTO');

-- CreateEnum
CREATE TYPE "ConQuienConvivir" AS ENUM ('CUALQUIERA', 'SOLO_MUJERES', 'SOLO_HOMBRES');

-- CreateTable
CREATE TABLE "PerfilRoomie" (
    "id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "presupuestoMax" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "zonaPreferida" TEXT,
    "carrera" TEXT,
    "semestre" INTEGER,
    "ritmo" "RitmoDeVida" NOT NULL DEFAULT 'MIXTO',
    "conQuien" "ConQuienConvivir" NOT NULL DEFAULT 'CUALQUIERA',
    "fuma" BOOLEAN NOT NULL DEFAULT false,
    "tieneMascota" BOOLEAN NOT NULL DEFAULT false,
    "aceptaMascotas" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "PerfilRoomie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactoRoomie" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitanteId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,

    CONSTRAINT "ContactoRoomie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilRoomie_usuarioId_key" ON "PerfilRoomie"("usuarioId");

-- CreateIndex
CREATE INDEX "PerfilRoomie_activo_presupuestoMax_idx" ON "PerfilRoomie"("activo", "presupuestoMax");

-- CreateIndex
CREATE INDEX "ContactoRoomie_destinatarioId_idx" ON "ContactoRoomie"("destinatarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactoRoomie_solicitanteId_perfilId_key" ON "ContactoRoomie"("solicitanteId", "perfilId");

-- AddForeignKey
ALTER TABLE "PerfilRoomie" ADD CONSTRAINT "PerfilRoomie_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoRoomie" ADD CONSTRAINT "ContactoRoomie_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoRoomie" ADD CONSTRAINT "ContactoRoomie_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactoRoomie" ADD CONSTRAINT "ContactoRoomie_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "PerfilRoomie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
