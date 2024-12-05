const bd = require('./db');

const ParticipantModel = bd.sequelize.define('Inscrever_Evento', {
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
            model: 'Eventos', 
            key: 'ID_Evento'
        }
    },
    ID_Usuario: {
        type: bd.Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios', 
            key: 'ID_Usuario'
        }
    }
}, {
    tableName: 'Inscrever_Evento', 
    timestamps: false 
});

module.exports = ParticipantModel;