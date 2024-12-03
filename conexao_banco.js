// conexao_banco.js
const mysql = require('mysql2');


// Configuração da conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'll300703',
    database: 'bdong'
});

// Verifica se a conexão com o banco foi bem-sucedida
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados: ' + err.stack);
        return;
    }
    console.log('Conexão bem-sucedida com o banco de dados');
});

module.exports = connection;

