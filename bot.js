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
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = 8080;
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const GUILD_ID = "1506830822207127552"; 
const CHECK_INTERVAL = 30000; 
let previousData = ""; 

// --- API ENDPOINT (Inayos: hindi na magka-crash kung wala pa ang file) ---
app.get('/api/members', (req, res) => {
    if (fs.existsSync('members.json')) {
        const data = fs.readFileSync('members.json', 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));

// --- BOT LOGIC ---
async function checkAndUpdateMembers() {
    console.log("🔍 SCANNING SERVER...");
    let guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) {
        console.log("❌ Guild not found, trying to fetch...");
        return;
    }

    try {
        // ✅ CRITICAL FIX: I-fetch ang members para siguradong hindi empty ang cache
        await guild.members.fetch();
        const members = guild.members.cache;
        const currentData = [];

        for (const [memberId, member] of members) {
            if (member.user.bot) continue;

            let decoration_url = null;
            let userStatus = member.presence ? member.presence.status : 'offline';

            try {
                // Babala: Huwag masyadong maraming members sa server para iwas rate limit
                const userData = await rest.get(Routes.user(member.id));
                if (userData && userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    decoration_url = `https://cdn.discordapp.com/avatar-decorations/${asset}.png?size=160`;
                }
            } catch (err) { /* silent fail */ }

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
        if (newDataString !== previousData) {
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;
            console.log("✅ members.json Updated!");
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
