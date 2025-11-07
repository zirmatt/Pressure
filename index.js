
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// อ่าน Token จาก Environment Variable (สำคัญมากสำหรับ Railway)
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN หายไป! อย่าลืมตั้งค่าใน Railway นะครับ");
    process.exit(1); // ออกจากโปรแกรมถ้าไม่มี Token
}

client.once('ready', () => {
    console.log(`บอท ${client.user.tag} ออนไลน์แล้ว!`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong!');
    }

    if (message.content === '!pressure') {
        message.reply('กิจกรรม "The Pressure" กำลังจะเริ่มขึ้น! (รันบน Railway 24/7)');
    }
});

client.login(BOT_TOKEN);