const { Client, GatewayIntentBits, AttachmentBuilder, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10'); 
const fs = require('fs');

// ✅ MGA INTENTS - TAMA ANG NAKALAGAY
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// ✅ GUMAGAMIT NG API VERSION 10 - ITO LANG ANG PWEDE PARA MAKUHA ANG DECORATION DATA
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// ✅ MGA SETTINGS MO - TAMA ITO
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 
const CHECK_INTERVAL = 30000; // ✅ Mag-iiscan bawat 30 segundo

let previousData = ""; 

async function checkAndUpdateMembers() {
    console.log("🔍 NAG-IISCAN... (AVATAR DECORATION MODE ACTIVE)");
    const guild = client.guilds.cache.get(GUILD_ID);
    
    if (!guild) { 
        console.log("❌ ERROR: Server hindi nakita o hindi naka-add ang bot dito."); 
        return; 
    }

    try {
        // ✅ Kinukuha ang lahat ng miyembro
        await guild.members.fetch();
        const currentData = [];

        // ✅ Umiikot sa bawat miyembro
        for (const member of guild.members.cache.values()) {
            // ✅ Laktawan kung BOT
            if (member.user.bot) continue;

            let decorationURL = null;
            try {
                // ✅ DITO KINUKUHA ANG TINATAGONG DATA NI DISCORD
                const userData = await rest.get(Routes.user(member.user.id));

                // ✅ KUNG MAY DECORATION, GUMAGAWA NG TAMANG LINK
                if (userData.avatar_decoration_data) {
                    const asset = userData.avatar_decoration_data.asset;
                    // ✅ PINAKATAMANG FORMAT NG LINK - GANITO GAWIN NI DISCORD
                    decorationURL = `https://cdn.discordapp.com/avatar-decorations/${member.user.id}/${asset}.png?size=256&format=png`;
                }
            } catch (err) { 
                // ✅ Walang gagawin kapag may error, ibabalik lang sa null
            }

            // ✅ ILALAGAY LAHAT NG DETALYE SA JSON
            currentData.push({
                id: member.user.id,                
                username: member.user.username,
                displayName: member.displayName || member.user.username,
                // ✅ Tamang format ng Avatar Link
                avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
                // ✅ DITO NAKALAGAY ANG LINK NG DECORATION (kung meron)
                effectURL: decorationURL 
            });
        }

        // ✅ Iko-compare kung may nagbago para hindi mag-save kung pareho lang
        const newDataString = JSON.stringify(currentData, null, 2);

        if (newDataString !== previousData) {
            console.log("✅ MAY PAGBABAGO! Nag-save ng bagong members.json...");
            fs.writeFileSync('members.json', newDataString);
            previousData = newDataString;

            // ✅ Magpapadala ng message sayo sa Discord kapag may update
            try {
                const user = await client.users.fetch(YOUR_ID);
                const file = new AttachmentBuilder('members.json');
                await user.send({ content: "🔔 **SYSTEM UPDATE!**\nBagong listahan ng miyembro at decoration.", files: [file] });
            } catch (err) {
                console.log("⚠️ Hindi nakapagpadala ng mensahe sayo.");
            }
        } else {
            console.log("😴 Walang pagbabago sa data...");
        }

    } catch (error) {
        console.error("❌ MATINDING ERROR:", error);
    }
}

// ✅ KAPAG NAKA-LOGIN NA ANG BOT
client.on('ready', async () => {
    console.log(`✅✅✅ BOT NAKA-LOGIN NA BILANG: ${client.user.tag}`);
    console.log("🚀 Nagsisimula na ang pagkuha ng data...");
    
    // ✅ Unang takbo pagkabuhay
    await checkAndUpdateMembers();
    
    // ✅ Uulit bawat 30 segundo
    setInterval(async () => { 
        await checkAndUpdateMembers(); 
    }, CHECK_INTERVAL);

    console.log(`⏱️ Auto-scan bawat ${CHECK_INTERVAL/1000} segundo.`);
});

// ✅ PAG-LOGIN
client.login(BOT_TOKEN);
