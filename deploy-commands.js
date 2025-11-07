const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { clientId, botToken, guildId } = require('./config.json');

const commands = [
    // --- คำสั่ง /roll ---
    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('ระบบทอยลูกเต๋า')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('รูปแบบลูกเต๋า (เช่น 1d20, 2d6+5)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('advantage')
                .setDescription('ทอยแบบได้เปรียบ (adv) หรือเสียเปรียบ (dis)')
                .setRequired(false)
                .addChoices(
                    { name: 'Advantage (adv)', value: 'adv' },
                    { name: 'Disadvantage (dis)', value: 'dis' }
                )),

    // --- (แถม) แปลง !ping เป็น /ping ---
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(botToken);

(async () => {
    try {
        console.log('กำลังลงทะเบียนคำสั่ง (/) ...');

        // เราลงทะเบียนคำสั่งกับ Discord
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('ลงทะเบียนคำสั่ง (/) สำเร็จ!');
    } catch (error) {
        console.error(error);
    }
})();