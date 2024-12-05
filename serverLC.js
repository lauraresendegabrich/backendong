// #region Declarações de variáveis de controle
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require("./conexao_banco");
const database = require("./models/db");
const axios = require('axios');


const { Op } = require("sequelize");
const { engine } = require("express-handlebars");
const path = require("path");
const methodOverride = require('method-override');
const flash = require('connect-flash');

// Instância do Express
const app = express();

// Middleware para flash messages
app.use(flash());

// Defina o mecanismo de visualização (exemplo: EJS)
app.set('view engine', 'ejs');

// Middleware para permitir métodos PUT e DELETE em formulários HTML
app.use(methodOverride('_method'));

// Modelos
const EventModel = require("./models/Event");
const ParticipantModel = require("./models/Participant");
const UserModel = require("./models/User");

// Definindo a associação entre os modelos
UserModel.hasMany(ParticipantModel, {
    foreignKey: 'ID_Usuario',
    as: 'participants',
});

ParticipantModel.belongsTo(UserModel, {
    foreignKey: 'ID_Usuario',
    as: 'user',
});

// #region Configuração Handlebars
app.engine("handlebars", engine({
    extname: '.hbs',
    defaultLayout: "main",
    helpers: {
        isEquals: function (a, b) {
            return a === b; 
        },
        Equals: function (a, b) {
            return a != b;
        },
        reverseDate: function (date) {
            const parts = date.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        },
        removeSeconds: function (time) {
            return time.slice(0, 5);
        },
        json: function (context) {
            return JSON.stringify(context);
        }
    }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
// #endregion

// #region Configuração Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// #endregion
// Configuração para utilizar elementos estáticos
app.use(express.static(path.join(__dirname, "public")));

// #region Configuração Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// #endregion

// #region Autentificador de conexão do Banco de Dados
database.sequelize.authenticate().then(function () {
    console.log("Banco de Dados Conectado com Sucesso!");
}).catch(function () {
    console.log("Erro ao conectar.");
});
// #endregion

app.use(express.json());


const port = 30079;
const SECRET_KEY = 'sua_chave_secreta'; // Use uma chave secreta mais segura em produção

app.use(cors());
app.use(bodyParser.json());

// Função para gerar o token JWT
function gerarToken(id) {
    return jwt.sign({ id }, SECRET_KEY, { expiresIn: '1h' });
}

// Middleware para verificar o token JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];  // Pega o token do cabeçalho Authorization

    console.log('Cabeçalho Authorization recebido:', req.headers['authorization']);  // Para depurar

    if (!token) {
        console.log("Token não fornecido na requisição.");
        return res.status(401).send({ message: 'Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("Token inválido ou expirado:", err);
            return res.status(401).send({ message: 'Token inválido ou expirado.' });
        }

        req.userId = decoded.id; // Adiciona o ID do usuário à requisição
        next(); // Passa o controle para a próxima função ou rota
    });
}


// #region Rotas Principais//

// Rota POST para o cadastro de usuários
app.post('/cadastro', async (req, res) => {
    const { nome, sobrenome, telefone, email, password } = req.body;

    if (!nome || !sobrenome || !telefone || !email || !password) {
        return res.status(400).send({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        const checkEmailQuery = 'SELECT * FROM Usuarios WHERE Email = ?';
        connection.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error('Erro ao verificar e-mail: ', err);
                return res.status(500).send({ message: 'Erro ao verificar e-mail.' });
            }

            if (results.length > 0) {
                return res.status(409).send({ message: 'E-mail já cadastrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = `INSERT INTO Usuarios (Nome, Sobrenome, Telefone, Email, Senha) 
                                 VALUES (?, ?, ?, ?, ?)`;
            connection.query(insertQuery, [nome, sobrenome, telefone, email, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Erro ao cadastrar usuário: ', err);
                    return res.status(500).send({ message: 'Erro ao cadastrar usuário' });
                }
                res.status(200).send({ message: 'Usuário cadastrado com sucesso!' });
            });
        });
    } catch (err) {
        console.error('Erro ao processar a senha:', err);
        return res.status(500).send({ message: 'Erro ao processar a senha.' });
    }
});

// Rota POST para login de usuário
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM Usuarios WHERE Email = ?';
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Erro ao verificar login no banco de dados:', err);
            return res.status(500).send({ message: 'Erro no servidor' });
        }

        if (results.length > 0) {
            const user = results[0];

            if (!user.senha) {
                console.error('Senha não encontrada no banco de dados para o usuário:', email);
                return res.status(500).send({ message: 'Senha não encontrada no banco de dados.' });
            }

            try {
                const match = await bcrypt.compare(password, user.senha);

                if (match) {
                    // Gera o token JWT com o ID do usuário
                    const token = gerarToken(user.id);
                    return res.status(200).send({ message: 'Login bem-sucedido', token });
                } else {
                    return res.status(401).send({ message: 'Usuário ou senha incorretos' });
                }
            } catch (error) {
                console.error('Erro ao comparar a senha:', error);
                return res.status(500).send({ message: 'Erro ao processar a comparação da senha.' });
            }
        } else {
            return res.status(401).send({ message: 'Usuário ou senha incorretos' });
        }
    });
});

// Rota GET para obter o perfil do usuário (uso do middleware de verificação de token)
app.get('/perfil', verificarToken, (req, res) => {
    const userId = req.userId; // ID do usuário extraído do token

    // Busca as informações do usuário no banco de dados
    const query = 'SELECT * FROM Usuarios WHERE id = ?';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar o perfil do usuário:", err);
            return res.status(500).send({ message: 'Erro ao buscar o perfil do usuário.' });
        }

        if (results.length > 0) {
            const user = results[0];
            res.status(200).send({ user });
        } else {
            console.log("Usuário não encontrado no banco de dados para o ID:", userId);
            res.status(404).send({ message: 'Usuário não encontrado.' });
        }
    });
});

// Rota PUT para atualizar o perfil do usuário autenticado
app.put('/perfil', verificarToken, (req, res) => {
    const userId = req.userId;
    const { nome, sobrenome, telefone, email } = req.body;
    const updateQuery = 'UPDATE Usuarios SET Nome = ?, Sobrenome = ?, Telefone = ?, Email = ? WHERE id = ?';
    connection.query(updateQuery, [nome, sobrenome, telefone, email, userId], (err) => {
        if (err) return res.status(500).send({ message: 'Erro ao atualizar o perfil do usuário.' });
        res.status(200).send({ message: 'Perfil atualizado com sucesso.' });
    });
});


app.post('/adminLogin', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM Adm WHERE Email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Erro ao verificar login do administrador:', err);
            return res.status(500).send({ message: 'Erro no servidor' });
        }

        if (results.length > 0) {
            const admin = results[0];

            // Imprimir o JSON do administrador no terminal
            console.log('Administrador encontrado:', JSON.stringify(admin, null, 2));

            // Verificar se a senha existe e não é nula
            if (!admin.Senha) {
                return res.status(500).send({ message: 'Dados inválidos para a comparação de senha.' });
            }

            // Logar a senha recebida e a senha armazenada
            console.log('Senha fornecida para comparação:', password);
            console.log('Senha armazenada no banco de dados:', admin.Senha);

            // Comparar a senha simples com a senha armazenada diretamente
            if (password === admin.Senha) {
                // Gera o token JWT com o ID do usuário
                const token = gerarToken(admin.ID_Adm);
                return res.status(200).send({ message: 'Login de administrador bem-sucedido', token });
               
            } else {
                return res.status(401).send({ message: 'Usuário ou senha de administrador incorretos' });
            }
        } else {
            return res.status(401).send({ message: 'Usuário ou senha de administrador incorretos' });
        }
    });
});



// Rota POST para solicitar um evento
app.post('/solicitarEvento', verificarToken, (req, res) => {
    const { Nome, Descricao, Status, Data, Horario, Num_Vagas, Local, Duracao, Nome_Responsavel } = req.body;
    const userId = req.userId; // ID do usuário extraído do token

    // Verifique os campos recebidos
    console.log('Dados recebidos:', req.body);

    // Validação dos campos obrigatórios
    if (!Nome || !Descricao || !Status || !Data || !Horario || !Num_Vagas || !Local || !Duracao || !Nome_Responsavel) {
        return res.status(400).send({ message: 'Por favor, preencha todos os campos.' });
    }

    // Consulta para inserir o evento no banco de dados
    const insertQuery = `
        INSERT INTO Evento (ID_Usuario, Nome, Descricao, Status, Data, Horario, Num_Vagas, Local, Duracao, Nome_Responsavel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(insertQuery, [userId, Nome, Descricao, Status, Data, Horario, Num_Vagas, Local, Duracao, Nome_Responsavel], (err, results) => {
        if (err) {
            console.error('Erro ao solicitar evento:', err);
            return res.status(500).send({ message: 'Erro ao solicitar evento.' });
        }

        // Retorna sucesso se o evento for inserido corretamente
        res.status(200).send({ message: 'Evento solicitado com sucesso!' });
    });
});

// Rota para obter eventos
app.get('/api/eventos', (req, res) => {
    const query = `
        SELECT * 
        FROM Evento 
        WHERE Status = 'aprovado' 
        AND Data > CURDATE()
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erro na consulta ao banco de dados:', err); // Log do erro no terminal
            res.status(500).json({ error: 'Erro ao buscar eventos', details: err.message }); // Inclui detalhes do erro na resposta
            return;
        }

        console.log('Resultados da consulta:', results); // Log dos resultados no terminal
        res.json(results); // Retorna apenas os eventos aprovados e futuros em formato JSON
    });
});

app.post('/api/eventos/:eventoID/inscrever', (req, res) => {
    const eventoID = req.params.eventoID;
    const { ID_Usuario } = req.body;

    if (!eventoID || !ID_Usuario) {
        return res.status(400).json({ error: 'Dados insuficientes para inscrição.' });
    }

    // Verificar número de vagas disponíveis
    const vagasQuery = `
        SELECT 
            e.Num_Vagas - COUNT(ie.ID_Inscricao) AS Vagas_Disponiveis
        FROM Evento e
        LEFT JOIN Inscrever_Evento ie ON e.ID_Evento = ie.ID_Evento
        WHERE e.ID_Evento = ?
        GROUP BY e.Num_Vagas
    `;

    connection.query(vagasQuery, [eventoID], (err, results) => {
        if (err) {
            console.error("Erro ao verificar vagas disponíveis:", err);
            return res.status(500).json({ error: 'Erro no servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        const vagasDisponiveis = results[0].Vagas_Disponiveis;

        if (vagasDisponiveis <= 0) {
            return res.status(400).json({ error: 'Não há vagas disponíveis para este evento.' });
        }

        // Verificar duplicação de inscrições
        const checkQuery = `
            SELECT * FROM Inscrever_Evento 
            WHERE ID_Evento = ? AND ID_Usuario = ?
        `;

        connection.query(checkQuery, [eventoID, ID_Usuario], (err, results) => {
            if (err) {
                console.error("Erro ao verificar duplicação de inscrição:", err);
                return res.status(500).json({ error: 'Erro no servidor.' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Usuário já inscrito neste evento.' });
            }

            // Inserir inscrição
            const insertQuery = `
                INSERT INTO Inscrever_Evento (ID_Evento, ID_Usuario)
                VALUES (?, ?)
            `;

            connection.query(insertQuery, [eventoID, ID_Usuario], (err, results) => {
                if (err) {
                    console.error("Erro ao inscrever-se no evento:", err);
                    return res.status(500).json({ error: 'Erro ao inscrever-se no evento.' });
                }
                res.json({ success: true });
            });
        });
    });
});




// Rota DELETE para excluir evento
app.delete('/api/eventos/:eventId', verificarToken, (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.userId;

    // Verificar se o evento existe e pertence ao usuário
    const checkEventQuery = 'SELECT * FROM Evento WHERE ID_Evento = ? AND ID_Usuario = ?';
    connection.query(checkEventQuery, [eventId, userId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar evento para exclusão:', err);
            return res.status(500).send({ message: 'Erro ao verificar evento para exclusão.' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'Evento não encontrado ou não pertence ao usuário.' });
        }

        // Excluir o evento
        const deleteEventQuery = 'DELETE FROM Evento WHERE ID_Evento = ?';
        connection.query(deleteEventQuery, [eventId], (err) => {
            if (err) {
                console.error('Erro ao excluir evento:', err);
                return res.status(500).send({ message: 'Erro ao excluir evento.' });
            }

            res.status(200).send({ message: 'Evento excluído com sucesso.' });
        });
    });
});

// Rota GET para retornar todos os eventos de um usuário
app.get('/api/eventos2', verificarToken, (req, res) => {
    const userId = req.query.userId;
    console.log("ID do usuário extraído do token:", userId);  // Log para verificar o userId

    if (!userId) {
        return res.status(400).send({ message: 'Parâmetro userId não fornecido.' });
    }

    // Consulta SQL para buscar todos os eventos do usuário
    const query = 'SELECT * FROM Evento WHERE ID_Usuario = ?';
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar eventos:', err);
            return res.status(500).send({ message: 'Erro ao buscar eventos.' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'Nenhum evento encontrado para o usuário.' });
        }

        console.log('Eventos encontrados:', results);  // Log dos eventos retornados

        // Retorna os eventos encontrados
        res.status(200).json(results);
    });
});

// #endregion //

// #region Rotas ADMIN

// #region Rotas GET

// Rota Principal
// Rota POST para validar o token

app.get("/solicitacoes", async function (req, res) {
    try {
        const dataAtual = new Date();
        const data = dataAtual.toLocaleDateString('en-CA');
        const horario = dataAtual.toTimeString().slice(0, 8);

        const eventsInReview = await EventModel.findAll({
            where: {
                Status: 'em analise',
                [Op.or]: [
                    { Data: { [Op.gt]: data } },
                    {
                        Data: data,
                        Horario: { [Op.gt]: horario }
                    }
                ]
            },
            order: [['Data', 'ASC']]
        });

        if (eventsInReview.length === 0) {
            return res.status(404).json({ message: 'Nenhum evento em análise encontrado.' });
        }

        res.render('solicitacaoEventosAdm', {
            eventsInReview: eventsInReview.map(event => event.dataValues)
        });
    } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar eventos.' });
    }
});


app.get("/eventos-futuros", async function (req, res) {
    try {
        const dataAtual = new Date();
        const data = dataAtual.toLocaleDateString('en-CA');
        const horario = dataAtual.toTimeString().slice(0, 8);

        const upcomingEvents = await EventModel.findAll({
            where: {
                Status: "aprovado",
                [Op.or]: [
                    { Data: { [Op.gt]: data } },

                    {
                        Data: data,
                        Horario: { [Op.gt]: horario }
                    }
                ]
            },
            order: [['Data', 'ASC']]
        });
        res.render('eventosFuturosAdm', {
            upcomingEvents: upcomingEvents.map(EventModel => EventModel.dataValues)
        });
    } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        res.status(500).send("Erro ao carregar eventos.");
    }
});

app.get("/criar-eventos",  async function (req, res) {
    try {
        res.render('criarEventosAdm');
    } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        res.status(500).send("Erro ao carregar eventos.");
    }
});

app.get("/relatorio-eventos",  async function (req, res) {
    try {
        const dataAtual = new Date();
        const dataLimite = new Date(dataAtual);
        dataLimite.setDate(dataAtual.getDate() - 30);
        const data = dataAtual.toLocaleDateString('en-CA');
        const horario = dataAtual.toTimeString().slice(0, 8);
        const dataLimiteFormatada = dataLimite.toLocaleDateString('en-CA');

        const eventReports = await EventModel.findAll({
            where: {
                Data: { [Op.gte]: dataLimiteFormatada }
            },
            order: [['Data', 'ASC']]
        });

        res.render('relatorioEventosAdm', {
            eventReports: eventReports.map(EventModel => EventModel.dataValues)
        });
    } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        res.status(500).send("Erro ao carregar eventos.");
    }
})

// #endregion

// #region Rotas POST
// #region Rotas POST
app.post("/getParticipants",  async (req, res) => {
    try {
        const { id_event } = req.body;

        if (!id_event) {
            return res.status(400).json({ error: "ID do evento não fornecido" });
        }

        console.log("ID Evento: " + id_event);

        const participants = await ParticipantModel.findAll({
            where: {
                ID_Evento: id_event
            },
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['nome'],
                }
            ],
        });

        if (participants && participants.length > 0) {
            const userNames = participants
                .map(participant => participant.user ? participant.user.nome : null)
                .filter(nome => nome !== null);

            return res.json({ participants: userNames });
        } else {
            return res.json({ participants: [] });
        }
    } catch (error) {
        console.error('Erro ao buscar participantes: ', error);
        return res.status(500).json({ error: 'Erro ao buscar participantes.' });
    }
});




app.delete("/deleteEvent",  async (req, res) => {
    try {
        const { event_id } = req.body;

        console.log("ID Evento: " + event_id);

        // Deleta o evento com o ID fornecido
        const deletedRows = await EventModel.destroy({
            where: { ID_Evento: event_id }
        });

        if (deletedRows > 0) {
            console.log("Evento deletado com sucesso!");
            res.redirect("/eventos-futuros")
        } else {
            console.log("Evento não encontrado.");
            res.status(404).send("Evento não encontrado.");
        }
    } catch (error) {
        console.error("Erro ao deletar o evento:", error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});


app.put("/updateEventStatus",  async (req, res) => {
    try {
        const { event_id, confirm } = req.body;

        console.log("ID Evento: " + event_id);
        console.log("Novo Status: " + confirm);

        // Atualiza o status do evento com o ID fornecido
        const [updatedRows] = await EventModel.update(
            { Status: confirm }, // Atualiza o campo `Status`
            { where: { ID_Evento: event_id } }
        );

        if (updatedRows > 0) {
            console.log(`Registros atualizados: ${updatedRows}`);
            res.redirect("/solicitacoes");
        } else {
            console.log("Evento não encontrado.");
            res.status(404).send("Evento não encontrado.");
        }
    } catch (error) {
        console.error("Erro ao atualizar o status do evento:", error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});


app.put("/editData",  async (req, res) => {
    try {
        const {
            event_ID,
            event_name,
            event_description,
            event_status,
            event_date,
            event_time,
            event_slots,
            event_location,
            event_duration,
            event_responsible
        } = req.body;

        const [updatedRows] = await EventModel.update(
            {
                Nome: event_name,
                Descricao: event_description,
                Status: event_status,
                Data: event_date,
                Horario: event_time,
                Num__Vagas: event_slots,
                Local: event_location,
                Duracao: event_duration,
                Nome_Responsavel: event_responsible
            },
            {
                where: { ID_Evento: event_ID }
            });
        console.log(`Registros atualizados: ${updatedRows}`);
        res.redirect("/eventos-futuros");
    } catch (error) {
        console.error("Erro ao processar os dados:", error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});

app.post("/createData",  async (req, res) => {
    try {
        const {
            event_name,
            event_description,
            event_date,
            event_time,
            event_slots,
            event_location,
            event_duration,
            event_responsible
        } = req.body;

        // Criação do evento no banco
        const event = await EventModel.create({
            Nome: event_name,
            Descricao: event_description,
            Status: 'aprovado',
            Data: event_date,
            Horario: event_time,
            Num__Vagas: event_slots,
            Local: event_location,
            Duracao: event_duration,
            Nome_Responsavel: event_responsible
        });

        console.log(`Evento criado com ID: ${event.id}`);

        res.redirect("/eventos-futuros");
    } catch (error) {
        console.error("Erro ao processar os dados:", error);
        res.status(500).send("Erro ao processar a solicitação.");
    }
});

app.post("/procurarEvento", function (req, res) {

    let whereCondition = {};

    if (req.body.opcao) {
        whereCondition.Status = req.body.opcao;
    }

    if (req.body.dataOpcao) {
        whereCondition.Data = {
            [Op.gte]: req.body.dataOpcao
        };
    }
    EventModel.findAll({
        where: whereCondition
    }).then(function (eventReports) {
        res.render('relatorioEventosAdm', {
            eventReports: eventReports.map(Evento => Evento.dataValues)
        });
    });
});

// #endregion


app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});