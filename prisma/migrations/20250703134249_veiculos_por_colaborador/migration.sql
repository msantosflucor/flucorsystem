/*
  Warnings:

  - You are about to drop the column `cor` on the `Colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `Colaborador` table. All the data in the column will be lost.
  - You are about to drop the column `placa` on the `Colaborador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Colaborador` DROP COLUMN `cor`,
    DROP COLUMN `modelo`,
    DROP COLUMN `placa`;

-- CreateTable
CREATE TABLE `Veiculo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `placa` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NOT NULL,
    `colaboradorId` INTEGER NOT NULL,

    INDEX `Veiculo_colaboradorId_idx`(`colaboradorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Veiculo` ADD CONSTRAINT `Veiculo_colaboradorId_fkey` FOREIGN KEY (`colaboradorId`) REFERENCES `Colaborador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
