const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const { hash, compare } = require("bcryptjs");
const session = require('express-session');
const authenticate = require("./middlewares/authenticate");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

app.use(cors());

app.use(session({
    secret: "K_*&$lpUTR@!çPÇ0524.nup",
    cookie: { maxAge: 1800000 }
}));



app.use(express.static('public'));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("login.ejs")

})


app.get("/portaria", authenticate, (req, res) => {
    res.render("portaria.ejs")

})


// Endpoint para criar uma nova portaria
app.post("/portaria", authenticate, async (req, res) => {
    try {
        const { nome, portaria, cpf, cargo, simbolo, secretaria, data, dataNomeacao } = req.body;
        console.log({ nome, portaria, cpf, cargo, simbolo, secretaria, data, dataNomeacao });

        // Validação básica dos dados
        if (!nome || !portaria || !cpf || !cargo || !simbolo || !secretaria || !data || !dataNomeacao) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }

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
                nomeacao: new Date(dataNomeacao),
            },
        });

        // Responde com a portaria criada
        res.status(201).json(novaPortaria);
    } catch (error) {
        console.error("Erro ao criar portaria:", error);
        res.status(error.status || 500).json({ error: error.message || "Erro ao criar portaria no servidor" });
    }
});


app.get("/service", authenticate, (req, res) => {
    res.render("service.ejs")
})



// Função para limpar CPF
function limparCPF(cpf) {
    return cpf.replace(/\D/g, ''); // Remove tudo que não for dígito
}

app.post("/authenticate", async (req, res) => {
    try {
        const { cpf, senha } = req.body;

        // Validação de entrada
        if (!cpf || !senha) {
            return res.status(400).json({ error: "CPF e senha são obrigatórios" });
        }

        // Limpar e validar CPF
        const cleanedCPF = limparCPF(cpf);
        if (cleanedCPF.length !== 11) {
            return res.status(400).json({ error: "CPF inválido" });
        }

        console.log(`Tentativa de login com CPF: ${cleanedCPF}`);

        // Procurar o usuário pelo CPF
        const user = await prisma.users.findFirst({ where: { cpf: cleanedCPF } });

        if (!user) {
            // Evitar revelar se o CPF existe ou não para maior segurança
            return res.redirect("/")
        }

        // Comparar a senha fornecida com a senha criptografada
        const isPasswordValid = await compare(senha, user.password);

        if (!isPasswordValid) {
            // TODO: Implementar limite de tentativas de login para proteção contra força bruta
            return res.redirect("/")
        }

        // Salvar os dados do usuário na sessão
        req.session.user = {
            id: user.id,
            name: user.nome,
        };

        console.log(`Usuário autenticado: ${user.nome} (ID: ${user.id})`);

        // Redirecionar para a página de serviço
        res.redirect("/service");

    } catch (error) {
        console.error('Erro ao autenticar usuário:', {
            message: error.message,
            stack: error.stack,
        });
        return res.redirect("/")
    }
});

app.get("/logout", (req, res) => {
    // Destroi a sessão do usuário
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar a sessão:", err);
            return res.status(500).send("Erro ao encerrar a sessão.");
        }

        // Redireciona para a página inicial ou de login
        res.redirect("/");
    });
});


app.post("/user", authenticate, async (req, res) => {
    const { nome, cpf, password } = req.body;

    console.log(nome, cpf, password)

    const cpfExite = await prisma.users.findFirst({ where: { cpf } });

    if (cpfExite) {
        throw new Error("Usuário já foi criado")
    };


    const passwordHash = await hash(password, 10);

    console.log(passwordHash)


    const user = await prisma.users.create({ data: { nome, cpf, password: passwordHash } });

    res.json(user)
});

app.use((req, res) => {
    res.status(404).render('404'); // Certifique-se que views/404.ejs existe
});

app.listen(8080, () => {
    console.log("Servidor rodando na porta 8080");
});