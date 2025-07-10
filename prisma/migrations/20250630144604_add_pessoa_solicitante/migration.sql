/*
  Warnings:

  - You are about to drop the column `tipo` on the `Acesso` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Acesso` DROP COLUMN `tipo`,
    ADD COLUMN `pessoaSolicitante` VARCHAR(191) NULL;
