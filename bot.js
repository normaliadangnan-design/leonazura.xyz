const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); // ✅ BAGONG API v10 (PARA MAKUHA ANG DECORATION)
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// ✅ GINAGAMIT NATIN ANG BAGONG REST API PARA SA DETALYE NG USER
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 

// ⏱️ ORAS NG PAG-I-CHECK: 30 segundo = 30000 ms
const CHECK_INTERVAL = 30000; 

let previousData = ""; 

// 🚀 PANGUNAHING PROSESO
async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN NG SERVER... (KASAMA NA ANG DECORATION)");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) {
        console.log("❌ HINDI MAHANAP ANG SERVER");
        return;
    }

    try {
        await guild.members.fetch();
        const currentData = [];

        // 👇 Iikot sa lahat ng miyembro
        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            // ✅ BAGONG PARAAN: KUKUNIN NATIN ANG DETALYE GAMIT ANG API v10
            // Dito talaga lumalabas ang avatar_decoration_data
            let decorationURL = null;
            try {
                // 👉 Ito ang sikreto para lumabas ang data na tinutukoy mo
                const userData = await rest.get(Routes.user(member.user.id));

                // ✅ KUNG MAY DETALYE NG DECORATION, GAWAIN ANG LINK
                if (userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    // Ito ang tamang format ng link, pareho sa publicenemy.xyz
                    decorationURL = `https://cdn.discordapp.com/avatar-decorations/${member.user.id}/${asset}.png?size=256`;
                }
            } catch (err) {
                // Kung hindi makuha o wala, hayaan lang, null ang value
                // console.log(`Walang decoration o error kay ${member.user.username}`);
            }

            // ✅ ILAGAY LAHAT SA LISTAHAN
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                effectURL: decorationURL  // 👈 ANDITO NA! MAY LAMAN KUNG MERON SILA, WALA KUNG WALA
            });
        }

        // ✅ IKUMPARA KUNG MAY NAGBAGO
        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO! NAGLILIKHA NG BAGONG FILE...");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            // 📩 I-SEND SA IYO
            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ 
                    content: "🔔 **UPDATE!** Bagong listahan (Kasama na ang Avatar Decoration data!)", 
                    files: [file] 
                });
                console.log("✅ NA-SEND SA DM!");
            } catch (err) {
                console.log("❌ HINDI MA-SEND ANG FILE.");
            }
        } else {
            console.log("😴 WALANG PAGBABAGO.");
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

client.on('ready', async () => {
    console.log(`✅ NAKA CONNECT NA: ${client.user.tag}`);
    await checkAndUpdateMembers();
    setInterval(async () => { await checkAndUpdateMembers(); }, CHECK_INTERVAL);
    console.log(`⏱️ MAG-IISCAN BAWAT ${CHECK_INTERVAL/1000} SEGUNDO | KUKUNIN NA ANG DECORATION GAYA SA PUBLICENEMY`);
});

client.login(BOT_TOKEN);
