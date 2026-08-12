-- CreateTable
CREATE TABLE "Conversacion" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inmuebleId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "arrendadorId" TEXT NOT NULL,

    CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leidoEn" TIMESTAMP(3),
    "conversacionId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversacion_arrendadorId_ultimoEn_idx" ON "Conversacion"("arrendadorId", "ultimoEn");

-- CreateIndex
CREATE INDEX "Conversacion_estudianteId_ultimoEn_idx" ON "Conversacion"("estudianteId", "ultimoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_inmuebleId_estudianteId_key" ON "Conversacion"("inmuebleId", "estudianteId");

-- CreateIndex
CREATE INDEX "Mensaje_conversacionId_creadoEn_idx" ON "Mensaje"("conversacionId", "creadoEn");

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_inmuebleId_fkey" FOREIGN KEY ("inmuebleId") REFERENCES "Inmueble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_arrendadorId_fkey" FOREIGN KEY ("arrendadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
