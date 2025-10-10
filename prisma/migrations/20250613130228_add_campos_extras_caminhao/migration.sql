/*
  Warnings:

  - Added the required column `documentoMotorista` to the `Caminhao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Caminhao` ADD COLUMN `anomaliaVeiculo` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `descricaoAnomalia` VARCHAR(191) NULL,
    ADD COLUMN `documentoMotorista` VARCHAR(191) NOT NULL,
    ADD COLUMN `estadoFisico` VARCHAR(191) NULL,
    ADD COLUMN `possuiEPI` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `possuiMTR` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `possuiNotaFiscal` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `vestimentaIrregular` BOOLEAN NOT NULL DEFAULT false;
