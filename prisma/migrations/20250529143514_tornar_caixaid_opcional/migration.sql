-- DropForeignKey
ALTER TABLE `Caminhao` DROP FOREIGN KEY `Caminhao_caixaId_fkey`;

-- DropIndex
DROP INDEX `Caminhao_caixaId_fkey` ON `Caminhao`;

-- AlterTable
ALTER TABLE `Caminhao` MODIFY `caixaId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Caminhao` ADD CONSTRAINT `Caminhao_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `Caixa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
