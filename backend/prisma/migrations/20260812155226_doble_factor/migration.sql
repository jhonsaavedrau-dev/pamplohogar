-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "dobleFactorActivadoEn" TIMESTAMP(3),
ADD COLUMN     "dobleFactorClave" TEXT,
ADD COLUMN     "dobleFactorUltimoPaso" INTEGER;

-- CreateTable
CREATE TABLE "CodigoRespaldo" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usadoEn" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "CodigoRespaldo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodigoRespaldo_usuarioId_idx" ON "CodigoRespaldo"("usuarioId");

-- AddForeignKey
ALTER TABLE "CodigoRespaldo" ADD CONSTRAINT "CodigoRespaldo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
