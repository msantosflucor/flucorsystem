-- AlterTable
ALTER TABLE `Caminhao` ADD COLUMN `carregamento` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `horaFimCarregamento` DATETIME(3) NULL,
    ADD COLUMN `horaInicioCarregamento` DATETIME(3) NULL;
