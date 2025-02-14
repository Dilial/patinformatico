const { wait } = require('../../../utils/utils');
module.exports = {
    name: 'clear',
    description: 'Elimina una cantidad de mensajes',
    permissions: ['ManageMessages'],
    run: async (client, message, args) => {

        if (!args[0]) return message.reply('Por favor, introduce la cantidad de mensajes a eliminar');
        if (isNaN(args[0])) return message.reply('Por favor, introduce un número válido');
        await message.channel.bulkDelete(args[0]);
        await message.channel.send(`${args[0]} mensajes eliminados`).then( async m => {
            await wait(1000);
            await m.delete();
        });
    }
};