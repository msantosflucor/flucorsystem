/*
  Warnings:

  - You are about to drop the column `aguardarNaCaixa` on the `Caminhao` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `Caminhao` table. All the data in the column will be lost.
  - Added the required column `motorista` to the `Caminhao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transportadora` to the `Caminhao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Caminhao` DROP COLUMN `aguardarNaCaixa`,
    DROP COLUMN `origem`,
    ADD COLUMN `motorista` VARCHAR(191) NOT NULL,
    ADD COLUMN `transportadora` VARCHAR(191) NOT NULL,
    ALTER COLUMN `status` DROP DEFAULT,
    MODIFY `tipo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Acidos', 'Lodo') NULL;

-- AlterTable
ALTER TABLE `Permissao` MODIFY `modulo` ENUM('DASHBOARD', 'LABORATORIO', 'HISTORICO', 'ESTACIONAMENTO', 'LINHAS', 'CAIXAS', 'CAMINHAO') NOT NULL;
