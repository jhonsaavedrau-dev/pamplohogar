-- CreateEnum
CREATE TYPE "MetodoDobleFactor" AS ENUM ('APP', 'CORREO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "codigoCorreoExpira" TIMESTAMP(3),
ADD COLUMN     "codigoCorreoHash" TEXT,
ADD COLUMN     "metodoDobleFactor" "MetodoDobleFactor" NOT NULL DEFAULT 'APP';
