-- AlterTable
ALTER TABLE `Colaborador` ADD COLUMN `litrosCombustivel` DOUBLE NULL,
    ADD COLUMN `tipoCombustivel` VARCHAR(191) NULL,
    ADD COLUMN `validadeFim` DATETIME(3) NULL,
    ADD COLUMN `validadeInicio` DATETIME(3) NULL;
