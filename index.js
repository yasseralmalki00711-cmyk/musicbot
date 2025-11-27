const express = require("express");
const app = express();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");
const play = require("play-dl");

// نجيب التوكن من متغيرات البيئة في Render
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.log("❌ مافي TOKEN! تأكد أنك ضايفه في Environment Variables باسم TOKEN");
  process.exit(1);
}

// إنشاء عميل الديسكورد مع الصلاحيات المطلوبة
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

// الأمر: !p اسم الأغنية
const PREFIX = "!p";

client.on("messageCreate", async (msg) => {
  // تجاهل البوتات والرسائل الخاصة
  if (msg.author.bot || !msg.guild) return;

  const content = msg.content.trim();

  // لازم الرسالة تبدأ بـ !p (جاهزة لأسماء عربية أو إنجليزي)
  if (!content.toLowerCase().startsWith(PREFIX)) return;

  // اللي بعد !p هو اسم الأغنية
  const query = content.slice(PREFIX.length).trim();

  if (!query) {
    return msg.reply("🎵 اكتب اسم الأغنية بعد الأمر `!p` مثال: `!p اصاله مبقاش انا`");
  }

  // نتأكد إن العضو في روم صوتي
  const vc = msg.member.voice.channel;
  if (!vc) {
    return msg.reply("🎧 لازم تكون داخل روم صوتي قبل ما أقدر أشغّل لك شيء!");
  }

  try {
    await msg.reply(`🔎 أبحث عن: **${query}** ...`);

    // البحث عن الأغنية في يوتيوب (يدعم عربي)
    const result = await play.search(query, { limit: 1 });
    if (!result.length) {
      return msg.reply("❌ ما لقيت أغنية بهذا الاسم، جرّب تكتب اسم أوضح.");
    }

    const song = result[0];

    // نجيب الستريم
    const stream = await play.stream(song.url);

    // ندخل الروم الصوتي
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
    console.error("Playback error:", err);
    msg.reply("⚠️ صار خطأ أثناء التشغيل، جرّب أمر آخر أو اسم ثاني.");
  }
});

// تسجيل الدخول للبوت
client.login(TOKEN);

// سيرفر بسيط لـ Render عشان يحافظ على البوت شغال
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is live");
});
