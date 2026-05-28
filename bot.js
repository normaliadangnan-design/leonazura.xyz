const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = "1506830822207127552"; 
const YOUR_ID = "1250654354344775703"; 

client.on('ready', async () => {
    console.log(`✅ NAKA CONNECT NA: ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.log("❌ HINDI MAHANAP ANG SERVER");
        // 🛑 PATAYIN AGAD PAG MAY ERROR
        process.exit(1); 
    }

    await guild.members.fetch();
    const membersData = [];

    guild.members.cache.forEach(member => {
        if(member.user.bot) return;
        membersData.push({
            id: member.user.id,
            username: member.user.username,
            displayName: member.displayName,
            avatarURL: member.user.avatarURL({ size: 256, extension: 'png' }) || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`,
            effectURL: null
        });
    });

    fs.writeFileSync('members.json', JSON.stringify(membersData, null, 2));

    try {
        const user = await client.users.fetch(YOUR_ID);
        const file = new AttachmentBuilder('members.json');
        
        // ✅ SIGURADUHING ISANG BESES LANG ITO
        await user.send({ 
            content: "📂 **Ito na ang members.json! I-upload mo ito sa GitHub**", 
            files: [file] 
        });
        console.log("✅ NA-SEND NA SA DM MO ANG FILE!");

    } catch (err) {
        console.log("❌ ERROR: Hindi maipadala. Check mo ang YOUR_ID.");
    }

    // ==================================================
    // ✅ ITO ANG SOLUSYON: MATIBAY NA PAGPATAY SA DULO
    // ==================================================
    console.log("🔌 PUMAPATAY NA SA BOT... TAPOS NA ANG GAWAIN.");
    setTimeout(() => { 
        client.destroy();  // Patayin ang koneksyon sa Discord
        process.exit(0);   // Lumabas at patayin ang proseso mismo
    }, 3000); // Maghihintay lang ng 3 segundo bago mamatay
});

client.login(BOT_TOKEN);
