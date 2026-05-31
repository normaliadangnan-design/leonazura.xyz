const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    presence: {
        status: 'online',
        activities: []
    }
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 
const CHECK_INTERVAL = 60000; // 1 minuto

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

            let decoration_url = null;
            let userStatus = member.presence ? member.presence.status : 'offline';

            try {
                const userData = await rest.get(Routes.user(member.user.id));

                if (userData && userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    const skuId = userData.avatar_decoration_data.sku_id;

                    if (skuId) {
                        decoration_url = `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=160`;
                    } else if (asset) {
                        decoration_url = `https://cdn.discordapp.com/avatar-decorations/${asset}.png?size=160`;
                    }
                }
            } catch (err) { 
                decoration_url = null;
            }

            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.displayAvatarURL({ size: 256, extension: 'png' }),
                effectURL: decoration_url,
                status: userStatus 
            });
        }

        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO! NA-UPDATE ANG LISTAHAN KASAMA ANG STATUS!");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\n*Nadetect na lahat: Dekorasyon at STATUS (Online/Idle/DND/Offline)*", files: [file] });
            } catch (err) {
                console.log("❌ Hindi maipadala ang DM sa iyo.");
            }
        } else {
            console.log("💤 Walang nagbago. Skip save.");
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
