const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 

// ⏱️ ORAS NG PAG-I-CHECK: 30 segundo = 30000 ms (Pwede mong baguhin)
const CHECK_INTERVAL = 30000; 

// Ito ang magtatago ng huling na-save na data para ikumpara kung may nagbago
let previousData = ""; 

// 🚀 ITO ANG PANGUNAHING PROSESO
async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN NG SERVER PARA SA MGA PAGBABAGO...");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) {
        console.log("❌ HINDI MAHANAP ANG SERVER");
        return;
    }

    try {
        // Kunin ang lahat ng miyembro
        await guild.members.fetch();
        const currentData = [];

        guild.members.cache.forEach(member => {
            if (member.user.bot) return;

            // ✅ DETECT NG AVATAR DECORATION / EFFECT
            let decorationURL = null;
            if (member.user.avatarDecoration) {
                const assetName = member.user.avatarDecoration.asset;
                decorationURL = `https://cdn.discordapp.com/avatar-decorations/${member.user.id}/${assetName}.png?size=256`;
            }

            // ✅ ISINAMA ANG USER ID, AT LAHAT NG DETALYE
            currentData.push({
                id: member.user.id,                // 👈 USER ID - SIGURADONG NASA LISTA ITO
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                effectURL: decorationURL            // 👈 AVATAR DECORATION - null kung wala
            });
        });

        // ✅ IKUMPARA ANG LUMANG DATA SA BAGO
        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            // 🔔 MAY PAGBABAGO!
            console.log("✅ MAY NA-DETECT NA PAGBABAGO! GAGAWA NG BAGONG FILE...");
            
            // Isulat ang bagong file
            fs.writeFileSync('members.json', newDataString);
            
            // I-save ito bilang "previousData" para sa susunod na check
            previousData =新DataString;

            // 📩 I-SEND SA IYO ANG BAGONG FILE
            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                
                await user.send({ 
                    content: "🔔 **MAY UPDATE!** May nagbago sa profile o avatar decoration. Nandito ang bagong listahan (kasama ang User ID):", 
                    files: [file] 
                });
                console.log("✅ NA-SEND SA DM ANG BAGONG UPDATE!");

            } catch (err) {
                console.log("❌ ERROR: Hindi maipadala sa iyo ang file. Siguraduhing bukas ang DM mo.");
            }

        } else {
            // 😴 WALA NAMANG NAGBAGO
            console.log("😴 Wala namang nagbago sa data. Walang ipapadala.");
        }

    } catch (error) {
        console.error("❌ MAY ERROR SA PAG-SCAN:", error);
    }
}

client.on('ready', async () => {
    console.log(`✅ NAKA CONNECT NA: ${client.user.tag}`);
    
    // 1. UNANG PAGTAKBO: Ipadala agad ang unang data pagkabukas
    await checkAndUpdateMembers();

    // 2. AUTO CHECK: Uulit sa itinakdang oras para maghanap ng pagbabago
    setInterval(async () => {
        await checkAndUpdateMembers();
    }, CHECK_INTERVAL);

    console.log(`⏱️ Ang bot ay patuloy na mag-iikot bawat ${CHECK_INTERVAL / 1000} segundo para maghanap ng update.`);
    console.log("🟢 NAKA-READY NA! Hihintayin na lang ang pagbabago sa server.");
});

client.login(BOT_TOKEN);
