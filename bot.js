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
const CHECK_INTERVAL = 60000; // 1 minuto para iwas rate-limit

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 INI-SCAN ANG SERVER... AUTOMATIC DETECTION MODE");
    
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

            // 1. Pwersahang i-set muna sa null ang decoration sa simula ng loop ng bawat member
            let decoration_url = null;

            try {
                // Kunin ang buong profile data ng user mula sa API
                const userData = await rest.get(Routes.user(member.user.id));

                // 2. I-check kung may valid na decoration data
                if (userData && userData.avatar_decoration_data && userData.avatar_decoration_data.asset) {
                    const asset = userData.avatar_decoration_data.asset;
                    
                    // Gagamit tayo ng .webp dahil ito ang standard ng Discord para sa static/animated assets
                    decoration_url = `https://cdn.discordapp.com/avatar-decorations/${asset}.webp?size=256`;
                }
            } catch (err) { 
                // Kung walang dekorasyon o nag-error ang request sa user na ito, 
                // mananatili itong `null` nang tahimik at walang isyu.
                decoration_url = null;
            }

            // 3. I-push sa array ang malinis na data
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.displayAvatarURL({ size: 256, extension: 'png' }),
                effectURL: decoration_url // Kung walang decoration, lalabas itong `null`
            });
        }

        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO SA MGA DEKORASYON! NAG-SAVE NG BAGO...");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Nadetect ng bot ang pinakabagong decorations!*", files: [file] });
            } catch (err) {
                console.log("❌ Hindi maipadala ang DM sa iyo.");
            }
        } else {
            console.log("💤 Walang nagbago sa dekorasyon ng mga miyembro. Skip save.");
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
