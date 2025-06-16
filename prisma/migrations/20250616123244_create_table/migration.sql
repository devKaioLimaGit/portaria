-- CreateTable
CREATE TABLE `Portaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `portaria` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `simbolo` VARCHAR(191) NOT NULL,
    `secretaria` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
