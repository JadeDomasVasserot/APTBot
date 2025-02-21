import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { queue, playMusic } from "../musicQueue.js";
import { fileURLToPath } from "url";
import { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior } from "@discordjs/voice";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const musicFolder = path.join(__dirname, "../musics");

export default {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Active ou désactive la lecture automatique de musiques du dossier music"),

  async execute(interaction) {
    const guildId = interaction.guildId;
    let serverQueue = queue.get(guildId);

    // Vérifier si le dossier musique contient des fichiers
    const musicFiles = fs.readdirSync(musicFolder).filter(file => file.endsWith(".mp3"));
    if (musicFiles.length === 0) {
      return interaction.reply("❌ Aucun fichier musical trouvé dans le dossier **musics/**.");
    }

    // Si aucune queue n'existe, en créer une et rejoindre le canal vocal
    if (!serverQueue) {
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      serverQueue = {
        connection,
        player,
        songs: [],
        loop: false,
        volume: 1,
        autoplay: false,
        destroyed: false,
      };

      queue.set(guildId, serverQueue);
      connection.subscribe(player);
    }

    // ✅ Activer l'autoplay immédiatement sans inversion
    if (!serverQueue.autoplay) {
      serverQueue.autoplay = true;
      interaction.reply("🔁 **Autoplay activé !** 🎵");
      loadRandomSongs(interaction, guildId);
    } else {
      serverQueue.autoplay = false;
      interaction.reply("⏹️ **Autoplay désactivé.**");
      serverQueue.songs = []; // Vider la queue
    }

    // Supprimer le message après 15 secondes
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000);
  },
};

// 🔄 **Charge 10 musiques aléatoires dans la queue**
async function loadRandomSongs(interaction, guildId) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || !serverQueue.autoplay) return;

  const musicFiles = fs.readdirSync(musicFolder).filter(file => file.endsWith(".mp3"));
  if (musicFiles.length === 0) {
    console.log("❌ Aucun fichier musical trouvé pour l'autoplay.");
    return;
  }

  // Charger 10 musiques aléatoires
  const randomSongs = [];
  while (randomSongs.length < 10 && musicFiles.length > 0) {
    const randomFile = musicFiles.splice(Math.floor(Math.random() * musicFiles.length), 1)[0];
    const filePath = path.join(musicFolder, randomFile);
    const title = randomFile.replace(".mp3", "");
    randomSongs.push({ filePath, title });
  }

  // Ajouter les musiques à la queue
  serverQueue.songs.push(...randomSongs);
  console.log(`🎵 ${randomSongs.length} musiques ajoutées à la queue`);

  // Lancer la lecture si elle n'est pas déjà en cours
  if (serverQueue.songs.length === randomSongs.length) {
    playMusic(interaction, guildId);
  }

  // **✅ Vérifier et recharger à la 8ᵉ musique**
  function monitorQueue() {
    console.log("🔄 Vérification de la queue pour autoplay...");

    if (!serverQueue.autoplay) {
      console.log("⏹️ Autoplay désactivé, arrêt de la vérification.");
      return;
    }

    if (serverQueue.songs.length <= 2) {
      console.log("🔄 Moins de 3 musiques restantes, recharge de 10 nouvelles musiques...");
      loadRandomSongs(interaction, guildId);
    } else {
      setTimeout(monitorQueue, 5000); // Vérifier toutes les 5 secondes
    }
  }

  setTimeout(monitorQueue, 5000); // Lancer la première vérification après 5s
}
