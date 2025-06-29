-- CreateTable
CREATE TABLE "portarias" (
    "id" SERIAL NOT NULL,
    "portaria" TEXT,
    "filename" TEXT,
    "nome" TEXT,
    "cpf" TEXT,
    "cargo" TEXT,
    "simbolo" TEXT,
    "secretaria" TEXT,
    "tipoDocumento" TEXT,
    "data" TIMESTAMP(3),
    "dataNomeacao" TIMESTAMP(3),

    CONSTRAINT "portarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
