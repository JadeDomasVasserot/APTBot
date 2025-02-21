import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import ytdl from "ytdl-core";
import ytsr from "ytsr";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");
const musicFolder = path.join(__dirname, "../musics");

// 📂 Vérifier si le dossier `musics/` existe, sinon le créer
if (!fs.existsSync(musicFolder)) {
  fs.mkdirSync(musicFolder, { recursive: true });
}

// 🔠 Fonction pour nettoyer le titre (conserve les espaces, supprime les caractères interdits)
function sanitizeTitle(title) {
  return title.replace(/[<>:"/\\|?*]/g, "").trim();
}

export default {
  data: new SlashCommandBuilder()
    .setName("addtomultipleplaylists")
    .setDescription("Ajoute une musique à plusieurs playlists")
    .addStringOption(option =>
      option.setName("musique")
        .setDescription("Nom ou lien de la musique")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("playlists")
        .setDescription("Liste des playlists (séparées par une virgule)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    let musicName = interaction.options.getString("musique");
    const playlistsInput = interaction.options.getString("playlists");

    // Séparer les noms de playlists
    const playlistNames = playlistsInput.split(",").map(name => name.trim());

    if (!fs.existsSync(playlistsFile)) {
      fs.writeFileSync(playlistsFile, JSON.stringify({}, null, 2));
    }

    let playlists = JSON.parse(fs.readFileSync(playlistsFile));

    if (!playlists[userId]) {
      playlists[userId] = {};
    }

    let videoURL = null;
    let videoId = null;

    // 🔍 Vérifier si la musique est déjà téléchargée
    await interaction.editReply(`🔍 Recherche de **"${musicName}"**...`);

    if (ytdl.validateURL(musicName)) {
      const info = await ytdl.getBasicInfo(musicName);
      videoURL = musicName;
      musicName = sanitizeTitle(info.videoDetails.title);
      videoId = info.videoDetails.videoId;
    } else {
      const searchResults = await ytsr(musicName, { limit: 1 });
      if (searchResults.items.length === 0) {
        return interaction.editReply("❌ Aucune vidéo trouvée.");
      }
      const firstVideo = searchResults.items[0];
      videoURL = firstVideo.url;
      musicName = sanitizeTitle(firstVideo.title);
      videoId = firstVideo.id;
    }

    const fileName = `${musicName} - ${videoId}.mp3`;
    const filePath = path.join(musicFolder, fileName);

    if (!fs.existsSync(filePath)) {
      // ⏬ Télécharger la musique
      await interaction.editReply(`⏬ Téléchargement de **"${musicName}"**...`);
      await new Promise((resolve, reject) => {
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 5 --no-post-overwrites -o "${filePath}" "${videoURL}"`;
        console.log(`🔄 Exécution de la commande : ${command}`);

        exec(command, async (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Erreur lors du téléchargement de ${musicName}:`, stderr);
            return interaction.editReply("❌ Erreur lors du téléchargement !");
          }
          console.log(`✅ Téléchargement terminé pour : ${musicName} - ${videoId}`);
          resolve();
        });
      });
    }

    let addedTo = [];

    // 📂 Ajouter la musique à chaque playlist spécifiée en respectant le bon format
    playlistNames.forEach(playlistName => {
      if (!playlists[userId][playlistName]) {
        playlists[userId][playlistName] = [];
      }
      playlists[userId][playlistName].push({ filePath, title: musicName });
      addedTo.push(playlistName);
    });

    fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));

    await interaction.editReply(`✅ **"${musicName}"** ajouté aux playlists : ${addedTo.join(", ")} 🎶`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  }
};
