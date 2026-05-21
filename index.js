const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { exec } = require('child_process');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '!';
const queue = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'play') {
        const url = args[0];
        if (!url) return message.reply('Usage: !play <youtube-url>');
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Join a voice channel first!');
        
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            exec(`yt-dlp -f bestaudio -o - "${url}"`, (err, stdout) => {
                if (err) return message.reply('Error fetching audio');
                const resource = createAudioResource(stdout);
                const player = createAudioPlayer();
                player.play(resource);
                connection.subscribe(player);
                message.reply(`Now playing: ${url}`);
            });
        } catch (err) {
            console.error(err);
            message.reply('Error joining voice channel');
        }
    }
    
    if (command === 'stop') {
        const connection = joinVoiceChannel.getVoiceConnection(message.guild.id);
        if (connection) connection.destroy();
        message.reply('Stopped playback');
    }
});

client.login(process.env.DISCORD_TOKEN);
