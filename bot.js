const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path'); // ✅ PARA SA TAMANG SAVE SA RAILWAY

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,  
        GatewayIntentBits.GuildPresences 
    ]
});

// ✅ GANITO PA RIN PARA KINUKUHA SA VARIABLES (WAG NA BAGUHIN)
const TOKEN = process.env.TOKEN; 
const GUILD_ID = process.env.GUILD_ID; 

// ✅ ITATAGO NATIN DITO ANG HULING DATA PARA ICOMPARE
let datingData = null;

client.on('ready', () => {
    console.log(`✅ Naka-login na bilang: ${client.user.tag}`);
    iScanAngServer();
    setInterval(iScanAngServer, 300000); // ✅ 5 minuto pa rin ang pag-check
});

async function iScanAngServer() {
    try {
        const server = client.guilds.cache.get(GUILD_ID);
        if (!server) return console.log("❌ Wala nahanap na server!");

        const mgaMiyembro = await server.members.fetch({ withPresences: true });
        const bagongData = [];

        mgaMiyembro.forEach(miyembro => {
            const mayDecoration = miyembro.user.avatarDecoration ? true : null;

            bagongData.push({
                id: miyembro.id,
                username: miyembro.user.username,
                displayName: miyembro.displayName || miyembro.user.username,
                avatarURL: miyembro.user.displayAvatarURL({ size: 1024, extension: 'png' }),
                hasDecoration: mayDecoration 
            });
        });

        // ==================================================
        // ✅ ANG PINAKA-IMPORTANTE: ICOMPARE KUNG MAY PAGBABAGO
        // ==================================================
        const datingString = JSON.stringify(datingData);
        const bagongString = JSON.stringify(bagongData);

        if (datingString === bagongString) {
            // 🔴 WALA NAGBAGO -> WAG MAG-SAVE, WAG GUMALAW
            console.log("ℹ️ Walang pagbabago na nahanap. Hindi magpapalit ng file.");
            return;
        }

        // 🟢 MAY PAGBABAGO -> SAKA LANG MAG-SAVE AT MAG-UPDATE
        datingData = bagongData; // I-save ang bagong datos para sa susunod na check
        const filePath = path.join(__dirname, 'members.json');
        fs.writeFileSync(filePath, JSON.stringify(bagongData, null, 4));
        console.log("✅ MAY PAGBABAGO! Na-update na ang members.json");

    } catch (error) {
        console.error("❌ May mali sa pag-scan:", error);
    }
}

client.login(TOKEN);
