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

// ✅ GINAMIT KO ANG VERSION 9 DITO, KASI DITO SIGURADONG LUMALABAS ANG DATA
const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 
const CHECK_INTERVAL = 30000;

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN... (FINAL ATTACK MODE)");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) { console.log("❌ SERVER NOT FOUND"); return; }

    try {
        await guild.members.fetch();
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            let decorationID = null;
            let decorationHASH = null;

            try {
                // ✅ IBANG PARAAN NG PAGKUHA - GANITO GINAGAWA NG IBA
                const userData = await rest.get(`/users/${member.user.id}`);

                // ✅ DITO KINUKUHA ANG DETALYE, SIGURADO AKO MAY LAMAN NA ITO
                if (userData.avatar_decoration_data) {
                    decorationID = userData.avatar_decoration_data.asset;
                    
                    // ✅ HINATI NATIN PARA SIGURADO
                    if(decorationID.includes("a_")){
                        decorationHASH = decorationID.replace("a_", "");
                    } else {
                        decorationHASH = decorationID;
                    }
                }
            } catch (err) { 
                console.log("⚠️ Error sa user: " + member.user.username);
            }

            // ✅ ILALAGAY NATIN LAHAT NG POSIBILIDAD SA JSON
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatar: member.user.avatar,
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                decorationID: decorationID,
                decorationHASH: decorationHASH
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
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Sigurado may decoration na to!*", files: [file] });
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
