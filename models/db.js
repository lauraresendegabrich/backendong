const Sequelize = require("sequelize");

//Configuração do Banco de Dados MySQL
const sequelize = new Sequelize('bdong', 'root', '1308', {
    host: "localhost",
    dialect: 'mysql'
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
};

