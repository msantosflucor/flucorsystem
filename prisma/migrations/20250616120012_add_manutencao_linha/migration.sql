-- CreateTable
CREATE TABLE `ManutencaoLinha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linhaId` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ManutencaoLinha_linhaId_idx`(`linhaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ManutencaoLinha` ADD CONSTRAINT `ManutencaoLinha_linhaId_fkey` FOREIGN KEY (`linhaId`) REFERENCES `Linha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
