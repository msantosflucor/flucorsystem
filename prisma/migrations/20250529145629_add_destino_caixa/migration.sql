-- AlterTable
ALTER TABLE `Caminhao` ADD COLUMN `destinoCaixaId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Caminhao` ADD CONSTRAINT `Caminhao_destinoCaixaId_fkey` FOREIGN KEY (`destinoCaixaId`) REFERENCES `Caixa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
