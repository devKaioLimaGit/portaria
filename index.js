const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

app.use(cors());



app.use(express.static('public')); // Se as pastas css e images estiverem em public/

// Configurar o EJS como template engine
app.set('view engine', 'ejs');

// Definir a pasta onde ficarão os arquivos .ejs
app.set('views', path.join(__dirname, 'views'));

// Permitir servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Para interpretar dados JSON e de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req,res)=>{
    res.render("portaria.ejs")
})
// Endpoint para criar uma nova portaria
app.post("/portaria", async (req, res) => {
    try {
        const { nome, portaria, cpf, cargo, simbolo, secretaria, data } = req.body;

        // Validação básica dos dados
        if (!nome || !portaria || !cpf || !cargo || !simbolo || !secretaria || !data) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }

        console.log(    )

        // Verifica se a portaria já existe
        const portaExiste = await prisma.portaria.findFirst({ where: { portaria } });

        if (portaExiste) {
            return res.status(409).json({ error: "Portaria já existe!" });
        }

        // Cria a portaria no banco de dados
        const novaPortaria = await prisma.portaria.create({
            data: {
                nome,
                portaria,
                cpf,
                cargo,
                simbolo,
                secretaria,
                data: new Date(data),
            },
        });

        // Responde com a portaria criada
        res.status(201).json(novaPortaria);
    } catch (error) {
        console.error("Erro ao criar portaria:", error);
        res.status(error.status || 500).json({ error: error.message || "Erro ao criar portaria no servidor" });
    }
});

app.listen(8080, () => {
    console.log("Servidor rodando na porta 8080");
});