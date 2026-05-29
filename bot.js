const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// ✅ GINAMIT NATIN ANG VERSION 10, DITO LUMALABAS ANG "PROFILE EFFECTS" / DECORATION
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 
const CHECK_INTERVAL = 30000;

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN... (PUBLICENEMY SYSTEM)");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) { console.log("❌ SERVER NOT FOUND"); return; }

    try {
        await guild.members.fetch();
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            // ✅ DITO NATIN ILALAGAY ANG TAWAG NILA: "profile_effects"
            let profile_effects = null; // ITO YUNG SINABI NILA
            let decoration_url = null;  // Ito ang lalabas na litrato

            try {
                // ✅ TAMANG PAGKUHA GAYA NG SISTEMA NILA
                const userData = await rest.get(Routes.user(member.user.id));

                // ✅ KUNG MAY "PROFILE EFFECTS" / AVATAR DECORATION
                if (userData.avatar_decoration_data) {
                    // Ito mismo ang tawag nila sa code nila
                    profile_effects = userData.avatar_decoration_data;
                    
                    // ✅ GAGAWIN NATIN ITONG BUONG LINK PARA DI NA MAHIRAPAN ANG WEBSITE
                    // Ito ang eksaktong format ng link ni Discord
                    const asset = userData.avatar_decoration_data.asset;
                    decoration_url = `https://cdn.discordapp.com/avatar-decorations/${member.user.id}/${asset}.png?size=256`;
                }
            } catch (err) { 
                console.log(`⚠️ Walang data kay: ${member.user.username}`);
            }

            // ✅ ILALAGAY NATIN LAHAT SA JSON, GAYA NG SA KANILA
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatar: member.user.avatar,
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                profile_effects: profile_effects,   // 👈 ETO YUNG SINABI NILA
                decoration_url: decoration_url      // 👈 ETO YUNG LITRATO
            });
        }

        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO! NAG-SAVE NG BAGO...");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Kasama na ang Profile Effects / Avatar Decoration!*", files: [file] });
            } catch (err) {}
        } else {
            console.log("😴 Walang pagbabago...");
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

client.on('ready', async () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    await checkAndUpdateMembers();
    setInterval(async () => { await checkAndUpdateMembers(); }, CHECK_INTERVAL);
});

client.login(BOT_TOKEN);
