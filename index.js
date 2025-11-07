// (ใหม่!) เพิ่ม Events และ InteractionResponseFlags
const { Client, GatewayIntentBits, Events, InteractionResponseFlags } = require('discord.js');

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

// =======================================================
// (ปรับปรุง!) แก้ 'ready' เป็น Events.ClientReady
// =======================================================
client.once(Events.ClientReady, () => {
    // เราไม่จำเป็นต้องใช้ client.user.tag ที่นี่ก็ได้ เพราะมันอาจจะยังไม่พร้อม
    console.log(`บอทออนไลน์แล้ว! (พร้อมรับ Slash Commands)`);
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
            const result = rollDiceHelper(diceString, advantage);

            const replyLines = [
                `-# _ _`,
                `-# ผลการทอย <@${interaction.user.id}>`,
                `→ ${result.description}`,
                `# <a:tpdice:1436248045766578320> ทอยได้ \`${result.total}\``,
                `-# _ _`
            ];

            const replyText = replyLines.join('\n');

            await interaction.reply({
                content: replyText
            });

        } catch (e) {
            // =======================================================
            // (ปรับปรุง!) แก้ ephemeral: true เป็น flags
            // =======================================================
            await interaction.reply({ 
                content: `Error: ${e.message}`, 
                flags: [InteractionResponseFlags.Ephemeral] // <-- แก้เป็นแบบนี้
            });
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
            description: `${roll1}, ${roll2} (เลือก: **${chosenRoll}**) ${modifierText}`,
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
            description: `${rollsText}${modifierText}`,
            total: `${total}`
        };
    }
}

// ล็อกอินเข้า Discord
client.login(BOT_TOKEN);