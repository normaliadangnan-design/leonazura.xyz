const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences, // ⚠️ Kailangan ito para mabasa status
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

// ✅ INAYOS NA: 15,000 ms = 15 segundo. LIGTAS NA ITO, WALA NANG RATE LIMIT!
const CHECK_INTERVAL = 15000; 

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 SCANNING SERVER... REAL-TIME MODE");
    
    let guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        try {
            guild = await client.guilds.fetch(GUILD_ID);
        } catch (err) {
            console.log("❌ SERVER NOT FOUND O WALANG AKSES");
            return;
        }
    }

    try {
        // ⚠️ MAHALAGA: Siguraduhing nakuha ang lahat ng presensya/status
        await guild.members.fetch({ withPresences: true }); 
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            let decoration_url = null;
            // ⚡ KUKUHA AGAD NG STATUS: online / idle / dnd / offline
            let userStatus = (member.presence && member.presence.status) ? member.presence.status : 'offline';

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

        // 💾 MAG-SAVE LANG KAPAG MAY PAGBABAGO
        if (newDataString !== previousData) {
            console.log("✅ NA-UPDATE! STATUS AT DECORATION NAI-SAVE!");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            // ✅ TINANGGAL KO ANG PAGPAPADALA NG FILE SA DM PARA HINDI NA MAGKAROON NG ERROR
            console.log("ℹ️ Nakasave na ang bagong data sa members.json");

        } else {
            console.log("💤 Walang pagbabago...");
        }

    } catch (error) {
        // ✅ INAYOS NA: Kapag may rate limit, lalaktawan lang niya at susubok ulit mamaya
        if (error.message.includes('rate limited')) {
            console.log("⚠️ Hinihintay ang Discord... Magbabalik agad!");
        } else {
            console.error("❌ ERROR:", error.message);
        }
    }
}

client.on('ready', async () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    console.log("🚀 REAL-TIME STATUS ACTIVE");
    
    // Simulan agad
    await checkAndUpdateMembers();
    // Ulitin bawat 15 segundo
    setInterval(async () => { await checkAndUpdateMembers(); }, CHECK_INTERVAL);
});

// 🛡️ PROTEKSIYON PARA HINDI TUMIGIL ANG BOT
process.on('unhandledRejection', error => {
    console.error('⚠️ BOT SAFETY:', error.message);
});

client.login(BOT_TOKEN);
