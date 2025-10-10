/*
  Warnings:

  - You are about to drop the column `modulo` on the `LogUsuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Analise` ADD COLUMN `motivoLiberacaoSemDescarga` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `LogUsuario` DROP COLUMN `modulo`,
    ADD COLUMN `contexto` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `LogUsuario` ADD CONSTRAINT `LogUsuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
