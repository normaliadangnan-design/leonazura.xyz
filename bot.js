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

// ✅ GINAMIT NATIN ANG TAMANG VERSION 10
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 
const CHECK_INTERVAL = 30000;

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN... (FINAL & PERFECT VERSION)");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) { console.log("❌ SERVER NOT FOUND"); return; }

    try {
        await guild.members.fetch();
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            // ✅ DITO NA GAGAWIN ANG BUONG LINK! WALANG KULANG
            let decorationFullURL = null;

            try {
                // ✅ KUKUHA NG DATA KAY DISCORD
                const userData = await rest.get(Routes.user(member.user.id));

                // ✅ KUNG MAY DECORATION, GAGAWIN AGAD ANG BUONG TAMANG LINK
                if (userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    // ✅ ITO ANG TAMANG LINK, KUMPLETO NA, HANDA NA IPASA SA WEBSITE
                    decorationFullURL = `https://cdn.discordapp.com/avatar-decorations/${member.user.id}/${asset}.png?size=256`;
                }
            } catch (err) { 
                console.log(`⚠️ Walang nakuha kay: ${member.user.username}`);
            }

            // ✅ ILALAGAY NATIN ANG BUONG LINK SA JSON
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                decorationURL: decorationFullURL // ✅ BUO NA ITO, DIRETSONG LALAGAY
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
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Kumpleto na ang links!*", files: [file] });
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
