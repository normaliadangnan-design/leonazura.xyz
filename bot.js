const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences, // ⚠️ IMPORTANTE: Kailangan ito para makita ang status
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
const CHECK_INTERVAL = 30000; // ⏱️ 30 segundo - Mas mabilis mag-update

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 INI-SCAN ANG SERVER... KUKUHA ANG STATUS");
    
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
        // Siguraduhing nakuha ang lahat ng miyembro at ang kanilang presensya/status
        await guild.members.fetch({ withPresences: true }); 
        const currentData = [];

        for (const member of guild.members.cache.values()) {
            if (member.user.bot) continue;

            let decoration_url = null;
            
            // ✅ AYOS NA: SIGURADONG KUKUHA ANG TAMANG STATUS
            // Kung wala nakuha, ituturing na 'offline'
            let userStatus = 'offline'; 
            if (member.presence && member.presence.status) {
                userStatus = member.presence.status; 
            }

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
                // Kung may error sa pagkuha ng palamuti, wala lang, tuloy lang
                decoration_url = null;
            }

            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.displayAvatarURL({ size: 256, extension: 'png' }),
                effectURL: decoration_url,
                status: userStatus // ✅ Ito ang ipapasa: online / idle / dnd / offline
            });
        }

        const newDataString = JSON.stringify(currentData, null, 2);

        // ✅ Ikukumpara ang luma at bago para lang mag-save kapag may nagbago
        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO! NA-UPDATE ANG STATUS AT DATA!");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            // ✅ Ipapadala sa iyo ang bagong file kapag may pagbabago
            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ 
                    content: "🔔 **SYSTEM UPDATE!**\n✅ Na-update na!\n• Online / Idle / Do Not Disturb / Offline\n• Kasama na ang mga palamuti", 
                    files: [file] 
                });
            } catch (err) {
                console.log("❌ Hindi maipadala ang DM sa iyo. Baka naka-off o hindi ka ka-server ng bot.");
            }
        } else {
            console.log("💤 Walang nagbago sa status o data.");
        }

    } catch (error) {
        console.error("❌ ERROR SA SCANNING:", error.message);
    }
}

client.on('ready', async () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    console.log("🌐 NAKA-CONNECT SA SERVER:", GUILD_ID);
    
    // Simulan agad ang unang scan
    await checkAndUpdateMembers();
    
    // Ulitin bawat 30 segundo (pwedeng baguhin, mas mabagal = mas kaunti ang reserbang gamit)
    setInterval(async () => { 
        await checkAndUpdateMembers(); 
    }, CHECK_INTERVAL);
});

// ✅ HINUHULING PARA HINDI TUMIGIL ANG BOT KAHIT MAY MALI
process.on('unhandledRejection', error => {
    console.error('⚠️ UNHANDLED ERROR:', error.message);
});

client.login(BOT_TOKEN);
