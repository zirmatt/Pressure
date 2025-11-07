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
    console.log(`บอท ${client.user.tag} ออนไลน์แล้ว! (พร้อมรับ Slash Commands)`);
});

// =======================================================
// ส่วนรับคำสั่ง !ping !pressure (แบบเก่า)
// =======================================================
client.on('messageCreate', message => {
    if (message.author.bot) return;

    // เรายังเก็บคำสั่งเก่าไว้ เผื่ออยากใช้
    if (message.content === '!ping') {
        message.reply('Pong! (จาก !ping)');
    }

    if (message.content === '!pressure') {
        message.reply('กิจกรรม "The Pressure" กำลังจะเริ่มขึ้น! (รันบน Railway 24/7)');
    }
});

// =======================================================
// (ใหม่!) ส่วนรับคำสั่ง / (Slash Commands)
// =======================================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // ----- คำสั่ง /ping -----
    if (commandName === 'ping') {
        await interaction.reply('Pong! (จาก /ping)');
    }

    // ----- คำสั่ง /roll -----
    if (commandName === 'roll') {
        const diceString = interaction.options.getString('dice');
        const advantage = interaction.options.getString('advantage'); // จะเป็น 'adv', 'dis', หรือ null

        try {
            // เราจะส่งไปให้ฟังก์ชันลูกเต๋าจัดการ
            const result = rollDiceHelper(diceString, advantage);
            await interaction.reply(result);
        } catch (e) {
            // ถ้าใส่มามั่วๆ (เช่น 1d20adv)
            await interaction.reply({ content: `Error: ${e.message}`, ephemeral: true });
        }
    }
});


// =======================================================
// (ใหม่!) ฟังก์ชันสำหรับทอยลูกเต๋า
// =======================================================
function rollDiceHelper(diceString, advantage) {
    // Regex นี้จะแยก "2d10+5"
    // group 1: 2 (จำนวนลูก)
    // group 2: 10 (หน้าเต๋า)
    // group 3: + (เครื่องหมาย)
    // group 4: 5 (เลขบวก/ลบ)
    const regex = /(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/;
    const match = diceString.toLowerCase().match(regex);

    if (!match) {
        throw new Error("รูปแบบผิดพลาดครับ ลอง `1d20` หรือ `2d6+3`");
    }

    const numDice = parseInt(match[1]);
    const diceSides = parseInt(match[2]);
    const modifierSign = match[3];
    const modifierValue = match[4] ? parseInt(match[4]) : 0;

    if (numDice > 100 || diceSides > 1000) {
        throw new Error("ทอยเต๋าเยอะ/ใหญ่เกินไปครับ (สูงสุด 100d1000)");
    }

    let total = 0;
    let rolls = [];

    // ฟังก์ชันทอย 1 ครั้ง
    const singleRoll = () => Math.floor(Math.random() * diceSides) + 1;

    // กรณีที่ 1: ทอยแบบ Adv/Dis (ต้องทอยลูกเดียวเท่านั้น)
    if (advantage && numDice === 1 && (advantage === 'adv' || advantage === 'dis')) {
        const roll1 = singleRoll();
        const roll2 = singleRoll();
        rolls = [roll1, roll2];

        let chosenRoll;
        if (advantage === 'adv') {
            chosenRoll = Math.max(roll1, roll2);
        } else { // 'dis'
            chosenRoll = Math.min(roll1, roll2);
        }
        total = chosenRoll; // เอาลูกที่เลือกมาคิด

        // บวก/ลบ เลข Modifier
        if (modifierSign === '+') total += modifierValue;
        if (modifierSign === '-') total -= modifierValue;

        const modifierText = modifierValue ? ` ${modifierSign} ${modifierValue}` : "";
        const advText = (advantage === 'adv') ? "Advantage" : "Disadvantage";

        // ตอบกลับ
        return `**ทอย ${advText} ${diceString}**\nผลลัพธ์: [${roll1}, ${roll2}] (เลือก: ${chosenRoll})${modifierText}\n**รวม: ${total}**`;

    // กรณีที่ 2: ทอยปกติ (หลายลูก หรือลูกเดียวแต่ไม่ Adv/Dis)
    } else {
        for (let i = 0; i < numDice; i++) {
            const roll = singleRoll();
            rolls.push(roll);
            total += roll;
        }

        // บวก/ลบ เลข Modifier
        if (modifierSign === '+') total += modifierValue;
        if (modifierSign === '-') total -= modifierValue;

        const modifierText = modifierValue ? ` ${modifierSign} ${modifierValue}` : "";
        // ถ้าทอยลูกเดียว ไม่ต้องโชว์ [20]
        const rollsText = (numDice > 1) ? `[${rolls.join(', ')}] ` : "";

        // ตอบกลับ
        return `**ทอย ${diceString}**\nผลลัพธ์: ${rollsText}${modifierText}\n**รวม: ${total}**`;
    }
}

// ล็อกอินเข้า Discord (ต้องอยู่บรรทัดท้ายๆ)
client.login(BOT_TOKEN);