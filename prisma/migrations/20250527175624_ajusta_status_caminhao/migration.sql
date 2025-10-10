/*
  Warnings:

  - You are about to alter the column `status` on the `Analise` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `Analise` MODIFY `status` ENUM('waiting', 'in_progress', 'approved', 'incompatible', 'rejected', 'finalizado') NOT NULL;

-- AlterTable
ALTER TABLE `Caminhao` MODIFY `status` ENUM('waiting', 'in_progress', 'approved', 'incompatible', 'rejected', 'finalizado') NOT NULL DEFAULT 'waiting';
