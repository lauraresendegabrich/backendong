// conexao_banco.js
const mysql = require('mysql2');


// Configuração da conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'bywkfdhs9ujddowzpp0q-mysql.services.clever-cloud.com',
    user: 'u4tfgiwlvubnpb71',
    password: 'Bq22tuCkgIkYoqovyw2J',
    database: 'bywkfdhs9ujddowzpp0q',
    port: 3306
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

