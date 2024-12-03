const bd = require('./db');

const ParticipantModel = bd.sequelize.define('inscrever_evento', {
    ID_Inscricao: {
        type: bd.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    ID_Evento: {
        type: bd.Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'eventos', 
            key: 'ID_Evento'
        }
    },
    ID_Usuario: {
        type: bd.Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios', 
            key: 'ID_Usuario'
        }
    }
}, {
    tableName: 'inscrever_evento', 
    timestamps: false 
});

module.exports = ParticipantModel;