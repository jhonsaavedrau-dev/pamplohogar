-- CreateEnum
CREATE TYPE "AccionAdmin" AS ENUM ('OCULTO_INMUEBLE', 'MOSTRO_INMUEBLE', 'ELIMINO_INMUEBLE', 'ELIMINO_USUARIO', 'CAMBIO_ROL', 'ELIMINO_RESENA', 'ATENDIO_REPORTE', 'DESCARTO_REPORTE');

-- CreateTable
CREATE TABLE "RegistroAdmin" (
    "id" TEXT NOT NULL,
    "accion" "AccionAdmin" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "RegistroAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroAdmin_creadoEn_idx" ON "RegistroAdmin"("creadoEn");

-- CreateIndex
CREATE INDEX "RegistroAdmin_adminId_idx" ON "RegistroAdmin"("adminId");

-- AddForeignKey
ALTER TABLE "RegistroAdmin" ADD CONSTRAINT "RegistroAdmin_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
