import { SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";
import ytdl from "ytdl-core";
import ytsr from "ytsr";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { queue, addToQueue, playMusic } from "../musicQueue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const musicFolder = path.join(__dirname, "../musics");

// 📂 Vérifier si le dossier `musics/` existe, sinon le créer
if (!fs.existsSync(musicFolder)) {
  fs.mkdirSync(musicFolder, { recursive: true });
}

// Fonction pour nettoyer le titre tout en conservant les espaces
function sanitizeTitle(title) {
  return title.replace(/[<>:"/\\|?*]/g, "").trim(); // Supprime uniquement les caractères interdits par Windows
}

export default {
  data: new SlashCommandBuilder()
    .setName("play-next")
    .setDescription("Ajoute une musique juste après la chanson en cours")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Lien YouTube ou nom de la musique")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("query");

    if (!interaction.member.voice.channel) {
      return interaction.editReply("❌ Tu dois être dans un salon vocal !");
    }

    let videoTitle = query;
    let videoURL;
    let videoId;

    // 🔎 **1. Vérifier si la musique existe déjà en local**
    const files = fs.readdirSync(musicFolder);
    const existingFile = files.find(file => file.toLowerCase().includes(query.toLowerCase()));

    if (existingFile) {
      const filePath = path.join(musicFolder, existingFile);
      playNext(interaction, { filePath, title: existingFile });
      return;
    }

    try {
      await interaction.editReply("⏳ Recherche de la musique...");

      // 🎵 **2. Trouver la vidéo YouTube**
      if (ytdl.validateURL(query)) {
        const info = await ytdl.getBasicInfo(query);
        videoTitle = info.videoDetails.title;
        videoURL = query;
        videoId = info.videoDetails.videoId;
      } else {
        const searchResults = await ytsr(query, { limit: 1 });
        if (searchResults.items.length === 0) {
          return interaction.editReply("❌ Aucune vidéo trouvée.");
        }
        const firstVideo = searchResults.items[0];
        videoURL = firstVideo.url;
        videoTitle = firstVideo.title;
        videoId = firstVideo.id;
      }

      // 🔠 **Nettoyage du titre tout en gardant les espaces**
      const safeTitle = sanitizeTitle(videoTitle);
      const fileName = `${safeTitle} - ${videoId}.mp3`;
      const filePath = path.join(musicFolder, fileName);

      // 📂 **3. Vérifier si le fichier existe déjà**
      if (fs.existsSync(filePath)) {
        playNext(interaction, { filePath, title: safeTitle });
        return;
      }

      await interaction.editReply(`🎵 Téléchargement de **${safeTitle}** en cours...`);

      // ⏬ **4. Télécharger et enregistrer la musique**
      exec(`yt-dlp -x --audio-format mp3 --audio-quality 0 --no-post-overwrites -o "${filePath}" "${videoURL}"`, async (error) => {
        if (error) {
          console.error("❌ Erreur lors du téléchargement :", error);
          return interaction.editReply("❌ Erreur lors du téléchargement !");
        }

        playNext(interaction, { filePath, title: safeTitle });
      });

    } catch (error) {
      console.error("❌ Erreur lors de l'exécution de la commande :", error);
      return interaction.editReply("❌ Une erreur est survenue. Veuillez réessayer.");
    }
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  }
};

// 🚀 **Fonction pour ajouter la musique après celle en cours**
function playNext(interaction, song) {
  const guildId = interaction.guildId;
  let serverQueue = queue.get(guildId);

  if (!serverQueue) {
    return interaction.editReply("❌ Aucun salon vocal actif !");
  }

  // 🎵 **Insérer la musique juste après la musique en cours**
  serverQueue.songs.splice(1, 0, song);

  interaction.editReply(`⏭️ **${song.title}** sera joué juste après la musique actuelle 🎶`);
}
