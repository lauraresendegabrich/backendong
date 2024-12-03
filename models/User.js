const bd = require('./db');

const UserModel = bd.sequelize.define('usuarios', {
    id: {
        type: bd.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: {
        type: bd.Sequelize.STRING(100),
        allowNull: true
    },
    sobrenome: {
        type: bd.Sequelize.STRING(100),
        allowNull: true
    },
    telefone: {
        type: bd.Sequelize.STRING(15),
        allowNull: true
    },
    email: {
        type: bd.Sequelize.STRING(100),
        allowNull: true
    },
    senha: {
        type: bd.Sequelize.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'usuarios', 
    timestamps: false
});

module.exports = UserModel;
