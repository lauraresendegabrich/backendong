const Sequelize = require("sequelize");


//Configuração do Banco de Dados MySQL
const sequelize = new Sequelize('bywkfdhs9ujddowzpp0q', 'u4tfgiwlvubnpb71', 'Bq22tuCkgIkYoqovyw2J', {
    host: "bywkfdhs9ujddowzpp0q-mysql.services.clever-cloud.com",
    dialect: 'mysql'
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};

