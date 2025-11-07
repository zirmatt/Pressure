// (ใหม่!) เพิ่ม EmbedBuilder เข้ามา
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN หายไป! อย่าลืมตั้งค่าใน Railway นะครับ");
    process.exit(1); 
}

client.once('ready', () => {
    console.log(`บอท ${client.user.tag} ออนไลน์แล้ว! (พร้อมรับ Slash Commands)`);
});

// =======================================================
// ส่วนรับคำสั่ง !ping !pressure (แบบเก่า)
// =======================================================
client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (message.content === '!ping') {
        message.reply('Pong! (จาก !ping)');
    }
    if (message.content === '!pressure') {
        message.reply('กิจกรรม "The Pressure" กำลังจะเริ่มขึ้น! (รันบน Railway 24/7)');
    }
});

// =======================================================
// (อัปเกรด!) ส่วนรับคำสั่ง / (Slash Commands)
// =======================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // ----- คำสั่ง /ping -----
    if (commandName === 'ping') {
        await interaction.reply('Pong! (จาก /ping)');
    }

    if (commandName === 'roll') {
        const diceString = interaction.options.getString('dice');
        const advantage = interaction.options.getString('advantage'); 

        try {
            const result = rollDiceHelper(diceString, advantage);

            const rollEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(result.title)
                // (จุดที่ 1: แก้ไขบรรทัดนี้)
                .setDescription(
                    `${result.description}\nรวม: **${result.total}**` // <-- เอา total มาต่อท้ายตรงนี้
                )
                // (จุดที่ 2: ลบบรรทัด .addFields() ทิ้งไปเลย)
                .setTimestamp()
                .setFooter({ text: `ทอยโดย ${interaction.member.displayName}` });

            await interaction.reply({
                content: `<@${interaction.user.id}>`,
                embeds: [rollEmbed]
            });

        } catch (e) {
            // ถ้า Error ก็ตอบกลับไปแบบลับๆ (ephemeral)
            await interaction.reply({ content: `Error: ${e.message}`, ephemeral: true });
        }
    }
});


// =======================================================
// (อัปเกรด!) ฟังก์ชันสำหรับทอยลูกเต๋า (ตอนนี้จะ return เป็น Object)
// =======================================================
function rollDiceHelper(diceString, advantage) {
    const regex = /(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/;
    const match = diceString.toLowerCase().match(regex);

    if (!match) {
        throw new Error("รูปแบบการทอยของคุณผิดพลาดค่ะ ลอง `1d20` หรือ `2d6+3`");
    }

    const numDice = parseInt(match[1]);
    const diceSides = parseInt(match[2]);
    const modifierSign = match[3];
    const modifierValue = match[4] ? parseInt(match[4]) : 0;

    if (numDice > 100 || diceSides > 1000) {
        throw new Error("คุณทอยเต๋าเยอะเกินไปค่ะ (สูงสุด 100d1000)");
    }

    let total = 0;
    let rolls = [];
    const singleRoll = () => Math.floor(Math.random() * diceSides) + 1;

    // กรณีที่ 1: ทอยแบบ Adv/Dis
    if (advantage && numDice === 1 && (advantage === 'adv' || advantage === 'dis')) {
        const roll1 = singleRoll();
        const roll2 = singleRoll();
        rolls = [roll1, roll2];
        
        let chosenRoll = (advantage === 'adv') ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
        total = chosenRoll; 
        
        if (modifierSign === '+') total += modifierValue;
        if (modifierSign === '-') total -= modifierValue;

        const modifierText = modifierValue ? ` ${modifierSign} ${modifierValue}` : "";
        const advText = (advantage === 'adv') ? "(Adv)" : "(Dis)";
        
        return {
            title: `<a:tpdice:1436248045766578320> ผลการทอย ${advText} ${diceString}`,
            description: `ผลลัพธ์: ${roll1}, ${roll2} (เลือก: **${chosenRoll}**) ${modifierText}`,
            total: `${total}`
        };

    // กรณีที่ 2: ทอยปกติ
    } else {
        for (let i = 0; i < numDice; i++) {
            const roll = singleRoll();
            rolls.push(roll);
            total += roll;
        }

        if (modifierSign === '+') total += modifierValue;
        if (modifierSign === '-') total -= modifierValue;

        const modifierText = modifierValue ? ` ${modifierSign} ${modifierValue}` : "";
        const rollsText = (numDice > 1) ? `[${rolls.join(', ')}]` : `ผล: ${rolls[0]}`; // ถ้าลูกเดียวโชว์แค่เลข

        // (ใหม่!) คืนค่าเป็น Object
        return {
            title: `<a:tpdice:1436248045766578320> ทอย ${diceString}`,
            description: `รายละเอียด: ${rollsText}${modifierText}`,
            total: `${total}` // แปลงเป็น String
        };
    }
}

// ล็อกอินเข้า Discord
client.login(BOT_TOKEN);