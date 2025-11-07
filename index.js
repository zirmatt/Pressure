const { Client, GatewayIntentBits } = require('discord.js');

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
    console.log(`บอทออนไลน์แล้ว`);
});

// =======================================================
// (อัปเกรด!) ส่วนรับคำสั่ง / (Slash Commands)
// =======================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'roll') {
        const diceString = interaction.options.getString('dice');
        const advantage = interaction.options.getString('advantage'); 

        try {
            // Helper ยังทำงานเหมือนเดิม (คืนค่าเป็น Object)
            const result = rollDiceHelper(diceString, advantage);

            // (ใหม่!) สร้างข้อความ Text ธรรมดาที่แก้ไขง่าย
            const replyLines = [
                `-# _ _`,
                `-# ผลการทอย <@${interaction.user.id}>`
                `→ ${result.description}`,
                `# <a:tpdice:1436248045766578320> ทอยได้ \`${result.total}\``,
                `-# _ _`
            ];

            // รวมทุกบรรทัด (ใช้ .join('\n') เพื่อขึ้นบรรทัดใหม่)
            const replyText = replyLines.join('\n');

            // ตอบกลับเป็น Text ธรรมดา (ไม่มี Embed)
            await interaction.reply({
                content: replyText
            });

        } catch (e) {
            await interaction.reply({ content: `Error: ${e.message}`, ephemeral: true });
        }
    }
});


// =======================================================
// (ฟังก์ชัน rollDiceHelper - ไม่ต้องแก้ไข)
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
            title: `-# ผลทอย ${diceString} ${advText}`,
            description: `**ผลการทอย** : ${roll1}, ${roll2} (เลือก: **${chosenRoll}**) ${modifierText}`,
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
        const rollsText = (numDice > 1) ? `[${rolls.join(', ')}]` : `${rolls[0]}`; 

        return {
            title: `<a:tpdice:1436248045766578320> ทอย ${diceString}`,
            description: `**ผลการทอย** : ${rollsText}${modifierText}`,
            total: `${total}`
        };
    }
}

// ล็อกอินเข้า Discord
client.login(BOT_TOKEN);