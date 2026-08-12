-- AlterEnum
ALTER TYPE "AccionAdmin" ADD VALUE 'ELIMINO_RESENA_BARRIO';

-- CreateTable
CREATE TABLE "ResenaBarrio" (
    "id" TEXT NOT NULL,
    "barrio" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "tranquilidad" INTEGER NOT NULL,
    "seguridad" INTEGER NOT NULL,
    "transporte" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "ResenaBarrio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResenaBarrio_clave_idx" ON "ResenaBarrio"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "ResenaBarrio_autorId_clave_key" ON "ResenaBarrio"("autorId", "clave");

-- AddForeignKey
ALTER TABLE "ResenaBarrio" ADD CONSTRAINT "ResenaBarrio_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
