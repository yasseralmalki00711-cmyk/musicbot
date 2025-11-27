const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");
const play = require("play-dl");

// نستخدم TOKEN من متغيرات البيئة أو ملف .env لاحقاً
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.log("❌ مافي TOKEN! لازم نضيفه بعدين في المتغيرات.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("ready", () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// /P اسم الأغنية
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith("/P")) return;

  const query = msg.content.replace("/P", "").trim();

  if (!query) {
    return msg.reply("🎵 اكتب اسم الأغنية بعد الأمر `/P`");
  }

  const vc = msg.member.voice.channel;
  if (!vc) {
    return msg.reply("🎧 لازم تكون داخل روم صوتي!");
  }

  try {
    await msg.reply(`🔎 أبحث عن: **${query}** ...`);

    const result = await play.search(query, { limit: 1 });
    if (!result.length) return msg.reply("❌ ما لقيت أغنية بهالاسم.");

    const song = result[0];
    const stream = await play.stream(song.url);

    const connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    player.play(resource);
    connection.subscribe(player);

    msg.channel.send(`▶️ تشغيل: **${song.title}**`);

  } catch (err) {
    console.log(err);
    msg.reply("⚠️ صار خطأ أثناء التشغيل.");
  }
});

client.login(TOKEN);
