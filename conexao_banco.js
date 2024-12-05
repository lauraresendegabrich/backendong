// conexao_banco.js
const mysql = require('mysql2');

// Configuração do pool de conexões com o banco de dados
const pool = mysql.createPool({
    host: 'bywkfdhs9ujddowzpp0q-mysql.services.clever-cloud.com',
    user: 'u4tfgiwlvubnpb71',
    password: 'Bq22tuCkgIkYoqovyw2J',
    database: 'bywkfdhs9ujddowzpp0q',
    waitForConnections: true, // Aguarda conexões livres no pool quando atingido o limite
    connectionLimit: 10,      // Número máximo de conexões simultâneas
    queueLimit: 0             // Sem limite de requisições enfileiradas
});

// Verifica se a conexão com o pool foi bem-sucedida
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados: ' + err.stack);
        return;
    }
    console.log('Conexão bem-sucedida com o banco de dados (pool de conexões)');
    connection.release(); // Libera a conexão de volta para o pool
});

module.exports = pool;