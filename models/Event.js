const bd = require('./db');

const Evento = bd.sequelize.define('Evento', {
    ID_Evento: {
        type: bd.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_Usuario: {
        type: bd.Sequelize.INTEGER,
        allowNull: true
    },
    Nome: {
        type: bd.Sequelize.STRING(100),
        allowNull: true
    },
    Descricao: {
        type: bd.Sequelize.STRING(300),
        allowNull: true
    },
    Status: {
        type: bd.Sequelize.STRING(30),
        allowNull: true
    },
    Data: {
        type: bd.Sequelize.DATEONLY,
        allowNull: false
    },
    Horario: {
        type: bd.Sequelize.TIME,
        allowNull: true
    },
    Num_Vagas: {
        type: bd.Sequelize.INTEGER,
        allowNull: true
    },
    Local: {
        type: bd.Sequelize.STRING(150),
        allowNull: true
    },
    Duracao: {
        type: bd.Sequelize.TIME,
        allowNull: true
    },
    Nome_Responsavel: {
        type: bd.Sequelize.STRING(100),
        allowNull: true
    },
    createdAt: {
        type: bd.Sequelize.DATE,
        allowNull: true
    },
    updatedAt: {
        type: bd.Sequelize.DATE,
        allowNull: true
    },
}, {
    tableName: 'evento',
    freezeTableName: true,
});

module.exports = Evento;