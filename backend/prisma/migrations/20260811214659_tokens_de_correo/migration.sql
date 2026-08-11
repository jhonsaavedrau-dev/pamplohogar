-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('RECUPERAR_CLAVE', 'VERIFICAR_CORREO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificadoEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TokenCorreo" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "TokenCorreo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenCorreo_tokenHash_key" ON "TokenCorreo"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenCorreo_usuarioId_tipo_idx" ON "TokenCorreo"("usuarioId", "tipo");

-- CreateIndex
CREATE INDEX "TokenCorreo_expiraEn_idx" ON "TokenCorreo"("expiraEn");

-- AddForeignKey
ALTER TABLE "TokenCorreo" ADD CONSTRAINT "TokenCorreo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
