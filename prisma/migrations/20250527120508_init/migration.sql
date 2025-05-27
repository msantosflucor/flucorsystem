-- CreateTable
CREATE TABLE `Unidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `corHex` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Caminhao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `placa` VARCHAR(191) NOT NULL,
    `origem` VARCHAR(191) NULL,
    `caixaId` INTEGER NOT NULL,
    `aguardarNaCaixa` BOOLEAN NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('waiting', 'in_progress', 'approved', 'incompatible', 'rejected') NOT NULL DEFAULT 'waiting',
    `tipo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Ácidos') NOT NULL DEFAULT 'Diversos',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Analise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caminhaoId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `tanque` VARCHAR(191) NOT NULL,
    `observacoes` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Caixa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `status` ENUM('livre', 'ocupada') NOT NULL,
    `tipoResiduo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Ácidos') NOT NULL,
    `linhaId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Caixa_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Linha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('Diversos', 'Oleoso', 'Alcalino', 'Ácidos') NOT NULL,
    `status` ENUM('active', 'maintenance') NOT NULL,
    `motivoManutencao` VARCHAR(191) NULL,
    `tempoMedio` INTEGER NOT NULL,
    `eficiencia` INTEGER NOT NULL,
    `cargaAtual` INTEGER NOT NULL,
    `ultimaManutencao` DATETIME(3) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Linha_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Caminhao` ADD CONSTRAINT `Caminhao_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `Caixa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Analise` ADD CONSTRAINT `Analise_caminhaoId_fkey` FOREIGN KEY (`caminhaoId`) REFERENCES `Caminhao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Caixa` ADD CONSTRAINT `Caixa_linhaId_fkey` FOREIGN KEY (`linhaId`) REFERENCES `Linha`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
