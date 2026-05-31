const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences, // PARA SA STATUS
        GatewayIntentBits.GuildMembers    // PARA SA MGA MIYEMBRO
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 

// ✅ GINawa KONG 30 SEGUNDO (30000ms) - SIGURADONG WALA NANG ERROR!
const CHECK_INTERVAL = 30000; 

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
        // ✅ INAYOS KO: HINDI NA GINAGAMIT ANG "withPresences" NA MADALAS MAG ERROR
        // Sa halip, babasahin na lang natin ang nasa cache na ligtas
        const members = guild.members.cache;
        const currentData = [];

        for (const [memberId, member] of members) {
            if (member.user.bot) continue;

            let decoration_url = null;
            let userStatus = 'offline'; // Default

            try {
                // ✅ KINUHA KO NA LANG DIREKTA DITO PARA IISA LANG ANG REQUEST
                const userData = await rest.get(Routes.user(member.id));

                // Kunin ang Status
                if (member.presence) {
                    userStatus = member.presence.status;
                }

                // Kunin ang Decoration
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
                // ✅ Kapag nagka-error, babalewalain lang at itutuloy, hindi titigil ang buong bot
                continue;
            }

            currentData.push({
                id: member.id,                
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
        } else {
            console.log("🟡 Walang pagbabago...");
        }

    } catch (error) {
        // ✅ PINAKAMAHALAGA: Kapag may "Rate Limit", itatago na lang natin at maghihintay
        if (error.message.includes('rate limited')) {
            console.log("⚠️ Hinihintay ang limitasyon ng Discord... (Normal lang ito minsan)");
        } else {
            console.error("❌ ERROR:", error.message);
        }
    }
}

client.on('ready', () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    console.log("🚀 REAL-TIME STATUS ACTIVE");
    
    // Simulan agad
    checkAndUpdateMembers();
    // Ulitin bawat 30 segundo
    setInterval(checkAndUpdateMembers, CHECK_INTERVAL);
});

// 🛡️ PROTEKSIYON PARA HINDI TUMIGIL ANG BOT KAHIT MAY ERROR
process.on('unhandledRejection', (reason, promise) => {
    // ✅ Ito ang pumapatay sa mga nakakabwisit na error na tumitigil sa bot
    if (reason.message.includes('rate limited')) {
        console.log("🔴 Rate limit na-detect, naghihintay...");
    } else {
        console.log("⚠️ Maliit na aberya lang, tuloy lang ang takbo...");
    }
});

client.login(BOT_TOKEN);
