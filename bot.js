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

const BOT_TOKEN = process.env.BOT_TOKEN;
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 

// 🚨 TINAMAAN DITO: Ginawang 60000 (1 minuto) para hindi ma-rate-limit ng Discord API
const CHECK_INTERVAL = 60000; 

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN... (FINAL FIX)");
    
    let guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        try {
            guild = await client.guilds.fetch(GUILD_ID);
        } catch (err) {
            console.log("❌ SERVER NOT FOUND O WALANG AKSES ANG BOT");
            return;
        }
    }

    try {
        await guild.members.fetch();
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            let decoration_url = null;

            try {
                // ✅ KUKUHA NG DATA GAMIT ANG REST API VERSION 10
                const userData = await rest.get(Routes.user(member.user.id));

                // ✅ KUNG MAY AVATAR DECORATION / PROFILE EFFECTS
                if (userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    decoration_url = `https://cdn.discordapp.com/avatar-decorations/${asset}.png?size=256`;
                }
            } catch (err) { 
                // Lalaktawan lang nang tahimik kapag walang Nitro decoration ang user
            }

            // ✅ ILALAGAY SA JSON
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.displayAvatarURL({ size: 256, extension: 'png' }),
                effectURL: decoration_url
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
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Final Version - Gumagana na ang decorations!*", files: [file] });
            } catch (err) {
                console.log("❌ Hindi maipadala ang DM sa iyo (Baka naka-close DM mo o block ang bot)");
            }
        } else {
            console.log("💤 Walang pagbabago sa mga miyembro. Skip save.");
        }

    } catch (error) {
        console.error("❌ ERROR SA SCANNING:", error);
    }
}

client.on('ready', async () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    await checkAndUpdateMembers();
    setInterval(async () => { await checkAndUpdateMembers(); }, CHECK_INTERVAL);
});

client.login(BOT_TOKEN);
