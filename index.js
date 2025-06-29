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


app.get("/portaria", authenticate, async (req, res) => {
    try {
        const ultimaPortaria = await prisma.portaria.findFirst({
            orderBy: {
                id: 'desc'  // Usa o maior ID como último registro
            }
        });


        console.log(ultimaPortaria)

        res.render("portaria.ejs", { ultimaPortaria });
    } catch (error) {
        console.error("Erro ao buscar última portaria:", error);
        res.status(500).send("Erro interno no servidor");
    }
});


app.post("/portaria", authenticate, async (req, res) => {
    try {
        const { nome, portaria, cpf, cargo, simbolo, secretaria, tipoDocumento, data, dataNomeacao } = req.body;

        console.log("Dados recebidos:", req.body);

        // Validação dos campos obrigatórios
        if (!nome || !portaria || !cpf || !cargo || !simbolo || !secretaria || !tipoDocumento || !data || !dataNomeacao) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios" });
        }

        // Validação de datas
        if (isNaN(new Date(data).getTime()) || isNaN(new Date(dataNomeacao).getTime())) {
            return res.status(400).json({ error: "Datas inválidas" });
        }

        // Verifica se a portaria já existe
        const portaExiste = await prisma.portaria.findFirst({ where: { portaria } });
        if (portaExiste) {
            return res.status(409).json({ error: "Portaria com esse número já existe!" });
        }

        // Verifica se o CPF já está registrado
        const portariaCpf = await prisma.portaria.findFirst({ where: { cpf } });
        if (portariaCpf) {
            return res.status(409).json({ error: "Portaria com esse CPF já existe!" });
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
                tipoDocumento,
                data: new Date(data),
                dataNomeacao: new Date(dataNomeacao), // Corrigido de 'nomeacao' para 'dataNomeacao'
            },
        });

        // Responde com a portaria criada
        res.status(201).json(novaPortaria);
    } catch (error) {
        console.error("Erro ao criar portaria:", error);
        res.status(error.status || 500).json({ error: error.message || "Erro ao criar portaria no servidor" });
    }
});


app.post("/portariaauth", authenticate, async (req, res) => {
    try {
        const {
            user,            // na verdade esse é o CPF
            password,
            nome,
            portaria,
            cpf,
            cargo,
            simbolo,
            secretaria,
            tipoDocumento,
            data,
            dataNomeacao
        } = req.body;

        // Verifica se o usuário (pelo CPF) existe
        const usuario = await prisma.users.findFirst({ where: { cpf: user } });

        if (!usuario) {
            return res.status(400).json({ error: "Usuário ou senha incorretos!" });
        }

        // Verifica a senha
        const senhaCorreta = await compare(password, usuario.password);

        if (!senhaCorreta) {
            return res.status(400).json({ error: "Usuário ou senha incorretos!" });
        }

        // Salvar os dados do usuário autenticado na sessão
        req.session.user = {
            id: usuario.id,
            name: usuario.nome,
        };

        console.log(`Usuário autenticado: ${usuario.nome} (ID: ${usuario.id})`);
        console.log("Dados recebidos:", req.body);

        // Validação dos campos obrigatórios
        if (!nome || !portaria || !cpf || !cargo || !simbolo || !secretaria || !tipoDocumento || !data || !dataNomeacao) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        // Validação de datas
        const dataObj = new Date(data);
        const dataNomeacaoObj = new Date(dataNomeacao);

        if (isNaN(dataObj.getTime()) || isNaN(dataNomeacaoObj.getTime())) {
            return res.status(400).json({ error: "Datas inválidas." });
        }

        // Criação da nova portaria
        const novaPortaria = await prisma.portaria.create({
            data: {
                nome,
                portaria,
                cpf,
                cargo,
                simbolo,
                secretaria,
                tipoDocumento,
                data: dataObj,
                dataNomeacao: dataNomeacaoObj,
            },
        });

        // Resposta de sucesso
        res.status(201).json(novaPortaria);

    } catch (error) {
        console.error("Erro ao criar portaria:", error);
        res.status(500).json({ error: "Erro ao criar portaria no servidor." });
    }
});


app.get("/editar-portaria/:id", authenticate, async (req, res) => {
    try {
        const id = req.params.id;

        // Busca a portaria pelo ID
        const portaria = await prisma.portaria.findUnique({
            where: { id: Number(id) }, // ou iddu: id, dependendo do seu schema
        });

        if (!portaria) {
            return res.status(404).send("Portaria não encontrada.");
        }

        // Renderiza a view EJS com os dados da portaria
        res.render("portariaedit.ejs", { portaria });

    } catch (error) {
        console.error("Erro ao buscar portaria:", error);
        res.status(500).send("Erro ao buscar portaria no servidor.");
    }
});


app.post("/portariaauth/:id", authenticate, async (req, res) => {
    try {
        const {
            user,            // esse é o CPF para autenticação
            password,
            nome,
            portaria,
            cpf,
            cargo,
            simbolo,
            secretaria,
            tipoDocumento,
            data,
            dataNomeacao
        } = req.body;

        const id = req.params.id;

        // Verifica se o usuário (pelo CPF) existe
        const usuario = await prisma.users.findFirst({ where: { cpf: user } });

        if (!usuario) {
            return res.status(400).json({ error: "Usuário ou senha incorretos!" });
        }

        // Verifica a senha
        const senhaCorreta = await compare(password, usuario.password);

        if (!senhaCorreta) {
            return res.status(400).json({ error: "Usuário ou senha incorretos!" });
        }

        // Salvar os dados do usuário autenticado na sessão
        req.session.user = {
            id: usuario.id,
            name: usuario.nome,
        };

        console.log(`Usuário autenticado: ${usuario.nome} (ID: ${usuario.id})`);
        console.log("Dados recebidos:", req.body);

        // Validação dos campos obrigatórios
        if (!nome || !portaria || !cpf || !cargo || !simbolo || !secretaria || !tipoDocumento || !data || !dataNomeacao) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        // Validação de datas
        const dataObj = new Date(data);
        const dataNomeacaoObj = new Date(dataNomeacao);

        if (isNaN(dataObj.getTime()) || isNaN(dataNomeacaoObj.getTime())) {
            return res.status(400).json({ error: "Datas inválidas." });
        }

        // Atualização da portaria
        const novaPortaria = await prisma.portaria.update({
            where: { id: Number(id) }, // ID vindo da URL
            data: {
                nome,
                portaria,
                cpf,
                cargo,
                simbolo,
                secretaria,
                tipoDocumento,
                data: dataObj,
                dataNomeacao: dataNomeacaoObj,
            },
        });

        // Resposta de sucesso
        res.status(200).json(novaPortaria);

    } catch (error) {
        console.error("Erro ao atualizar portaria:", error);
        res.status(500).json({ error: "Erro ao atualizar portaria no servidor." });
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

function formatDateBR(date) {
  if (!date) return "";
  const d = new Date(date);
  // Ajustar para o fuso horário local (adiciona o offset para compensar UTC)
  const adjustedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
  const day = ("0" + adjustedDate.getDate()).slice(-2);
  const month = ("0" + (adjustedDate.getMonth() + 1)).slice(-2);
  const year = adjustedDate.getFullYear();
  return `${day}/${month}/${year}`;
}

app.get("/lista-portaria", async (req, res) => {
  const portarias = await prisma.portaria.findMany();
  const portariasFormatadas = portarias.map(p => ({
    ...p,
    data: formatDateBR(p.data),
    dataNomeacao: formatDateBR(p.dataNomeacao)
  }));
  console.log("Portarias brutas:", portarias);
  console.log("Portarias formatadas:", portariasFormatadas);
  res.render("listPortaria.ejs", { portarias: portariasFormatadas });
});


app.post("/user", async (req, res) => {
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

app.listen(3000, () => {
    console.log("Servidor rodando na porta " + 3000);
});