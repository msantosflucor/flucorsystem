-- AlterTable
ALTER TABLE `Analise` MODIFY `status` ENUM('waiting', 'in_progress', 'approved', 'incompatible', 'rejected', 'finalizado', 'liberado_para_carregar') NOT NULL;

-- AlterTable
ALTER TABLE `Caminhao` MODIFY `status` ENUM('waiting', 'in_progress', 'approved', 'incompatible', 'rejected', 'finalizado', 'liberado_para_carregar') NOT NULL;
