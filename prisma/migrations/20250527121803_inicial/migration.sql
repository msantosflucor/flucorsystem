/*
  Warnings:

  - The values [Ácidos] on the enum `Linha_tipo` will be removed. If these variants are still used in the database, this will fail.
  - The values [Ácidos] on the enum `Linha_tipo` will be removed. If these variants are still used in the database, this will fail.
  - The values [Ácidos] on the enum `Linha_tipo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Caixa` MODIFY `tipoResiduo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Acidos', 'Lodo') NOT NULL;

-- AlterTable
ALTER TABLE `Caminhao` MODIFY `tipo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Acidos', 'Lodo') NOT NULL DEFAULT 'Diversos';

-- AlterTable
ALTER TABLE `Linha` MODIFY `tipo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Acidos', 'Lodo') NOT NULL;
