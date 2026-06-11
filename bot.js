const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,   // ✅ PARA SA STATUS AT AKTIBIDAD
        GatewayIntentBits.GuildMembers,     // ✅ PARA SA MGA MIYEMBRO
        GatewayIntentBits.GuildMessages     // ✅ PARA MAKAPAG-DM
    ],
    presence: {
        status: 'online',
        activities: [{ name: 'Monitoring', type: 3 }]
    }
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = 8080;
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const GUILD_ID = "1506830822207127552"; 
const CHECK_INTERVAL = 30000; // 30 segundo
const OWNER_ID = "1250654354344775703"; // ✅ ILAGAY DITO ANG ID MO!
let previousData = ""; 

// --- API ENDPOINT ---
app.get('/api/members', (req, res) => {
    if (fs.existsSync('members.json')) {
        const data = fs.readFileSync('members.json', 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));

// --- 📩 FUNCTION PARA MAG-SEND NG DM SA'YO ---
async function sendFileToOwner() {
    try {
        const user = await client.users.fetch(OWNER_ID);
        await user.send({
            content: "📋 **UPDATED MEMBERS DATA** | Azura Security",
            files: [{ attachment: './members.json', name: 'members.json' }]
        });
        console.log("✅ members.json SENT TO YOUR DM!");
    } catch (err) {
        console.log("❌ FAILED TO SEND DM:", err.message);
    }
}

// --- BOT SCAN & UPDATE FUNCTION ---
async function checkAndUpdateMembers() {
    console.log("🔍 SCANNING SERVER...");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) {
        console.log("❌ Guild not found, trying to fetch...");
        return;
    }

    try {
        // Siguraduhing nakuha lahat ng members
        await guild.members.fetch({ force: true });
        const members = guild.members.cache;
        const currentData = [];

        for (const [memberId, member] of members) {
            if (member.user.bot) continue;

            // 🎨 AVATAR DECORATION / EFFECT URL — ✅ PERFECT NA ITO!
            let decoration_url = null; // ✅ DEFAULT: NULL KUNG WALA
            try {
                const userData = await rest.get(Routes.user(member.id));
                
                // ✅ SIGURADUHIN MUNA NA MAY DATA AT ASSET BAGO GUMAWA NG LINK
                if (userData && userData.avatar_decoration_data && userData.avatar_decoration_data.asset) {
                    const asset = userData.avatar_decoration_data.asset;
                    // ✅ TAMANG LINK FORMAT (.gif) — GAGANA SA BROWSER
                    decoration_url = `https://cdn.discordapp.com/avatar-decorations/${asset}.gif?size=160`;
                    console.log(`✅ DECORATION FOUND: ${member.user.tag} → ${decoration_url}`);
                } else {
                    // ✅ KUNG WALA, MANATILING NULL
                    console.log(`⚪ NO DECORATION: ${member.user.tag}`);
                }
            } catch (err) { 
                // ✅ KUNG MAY ERROR, NULL PARIN ANG ILALAGAY
                console.log(`❌ ERROR GETTING DECORATION: ${member.user.tag}`);
                decoration_url = null;
            }

            // 🟢 STATUS: online / idle / dnd / offline
            const userStatus = member.presence?.status || 'offline';

            // 🎮 AKTIBIDAD: Spotify, Playing, Watching, Custom Status
            let activityType = null;
            let activityName = null;
            let customNote = null;
            let customEmoji = null;

            if (member.presence?.activities) {
                for (const act of member.presence.activities) {
                    // 📝 CUSTOM STATUS / NOTE
                    if (act.type === 4) { 
                        customNote = act.state || null;
                        customEmoji = act.emoji ? act.emoji.name : null;
                    }
                    // 🎵 SPOTIFY
                    else if (act.name === 'Spotify') {
                        activityType = 'Listening to Spotify';
                        activityName = `${act.details || 'Track'} - ${act.state || 'Artist'}`;
                    }
                    // 🎮 PLAYING
                    else if (act.type === 0) {
                        activityType = 'Playing';
                        activityName = act.name;
                    }
                    // 👀 WATCHING
                    else if (act.type === 3) {
                        activityType = 'Watching';
                        activityName = act.name;
                    }
                    // 🎙️ STREAMING
                    else if (act.type === 1) {
                        activityType = 'Streaming';
                        activityName = act.name;
                    }
                    // 📢 COMPETING
                    else if (act.type === 5) {
                        activityType = 'Competing in';
                        activityName = act.name;
                    }
                }
            }

            // ✅ IPUNAN ANG DATA
            currentData.push({
                id: member.id,
                username: member.user.username,
                displayName: member.displayName,
                avatarURL: member.user.displayAvatarURL({ size: 256, extension: 'png', forceStatic: false }),
                effectURL: decoration_url, // ✅ TAMA: LINK KUNG MERON, NULL KUNG WALA
                status: userStatus,
                activity: {
                    type: activityType,
                    name: activityName
                },
                customStatus: {
                    note: customNote,
                    emoji: customEmoji
                }
            });
        }

        // ✅ I-SAVE AT I-DM LANG KUNG MAY PAGBABAGO
        const newDataString = JSON.stringify(currentData, null, 2);
        if (newDataString !== previousData) {
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;
            console.log("✅ members.json UPDATED SUCCESSFULLY!");
            
            // 📩 IPADALA SA'YO SA DM
            await sendFileToOwner();
        } else {
            console.log("ℹ️ No changes detected.");
        }

    } catch (error) {
        console.error("❌ ERROR in scan:", error.message);
    }
}

client.on('ready', () => {
    console.log(`✅ LOGGED IN AS: ${client.user.tag}`);
    checkAndUpdateMembers();
    setInterval(checkAndUpdateMembers, CHECK_INTERVAL);
});

client.login(BOT_TOKEN);
