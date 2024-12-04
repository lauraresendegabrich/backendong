const Sequelize = require("sequelize");

//Configuração do Banco de Dados MySQL
const sequelize = new Sequelize('bywkfdhs9ujddowzpp0q', 'u4tfgiwlvubnpb71', 'Bq22tuCkgIkYoqovyw2J', {
    host: 'bywkfdhs9ujddowzpp0q-mysql.services.clever-cloud.com',
    dialect: 'mysql',
    port: 3306, // Certifique-se de que a porta está correta
    logging: false // Opcional: desativa logs SQL no console
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};

