import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } from "@discordjs/voice";
import { spawn } from "child_process";

export default {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Lance une radio YouTube en continu")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("Lien YouTube de la radio en direct ou d'une playlist")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");

    if (!interaction.member.voice.channel) {
      return interaction.reply("❌ Tu dois être dans un salon vocal !");
    }

    await interaction.deferReply();

    try {
      console.log("🔄 Connexion au salon vocal...");
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });

      function playStream() {
        console.log("🎵 Lecture du stream YouTube :", url);

        const process = spawn("yt-dlp", [
          "-o", "-",
          "-q", "--no-warnings",
          "-f", "bestaudio",
          url
        ]);

        process.stderr.on("data", (data) => {
          console.error(`yt-dlp stderr: ${data}`);
        });

        process.stdout.on("error", (error) => {
          console.error(`❌ Erreur de streaming yt-dlp: ${error}`);
          interaction.editReply("❌ Erreur lors de la lecture de la radio.");
        });

        const resource = createAudioResource(process.stdout);
        player.play(resource);
      }

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("▶️ La radio est en cours de lecture !");
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log("🔄 Reconnexion au stream...");
        playStream();
      });

      player.on("error", (error) => {
        console.error("❌ Erreur audio :", error);
      });

      connection.subscribe(player);
      playStream();

      interaction.editReply(`📻 **Lecture de la radio YouTube :** [🔗 Lien](${url})`);
    } catch (error) {
      console.error("❌ Erreur lors de l'exécution :", error);
      interaction.editReply("❌ Une erreur est survenue.");
    }
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
