import { SlashCommandBuilder } from "discord.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ytpl from "ytpl";
import { queue, addToQueue, playMusic } from "../musicQueue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const musicFolder = path.join(__dirname, "../musics");

// 📂 Vérifier si le dossier `musics/` existe, sinon le créer
if (!fs.existsSync(musicFolder)) {
  fs.mkdirSync(musicFolder, { recursive: true });
}

// 🔠 Fonction pour nettoyer le titre (supprime les caractères interdits mais conserve les espaces)
function sanitizeTitle(title) {
  return title.replace(/[<>:"/\\|?*]/g, "").trim();
}

export default {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Télécharge et ajoute une playlist YouTube à la queue, une par une")
    .addStringOption(option =>
      option.setName("url").setDescription("Lien de la playlist YouTube").setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const url = interaction.options.getString("url");

    if (!interaction.member.voice.channel) {
      return interaction.editReply("❌ Tu dois être dans un salon vocal !");
    }

    try {
      // 📜 **1. Récupérer la playlist YouTube**
      const playlist = await ytpl(url);
      console.log("📜 Playlist récupérée :", playlist);
      if (!playlist.items.length) {
        return interaction.editReply("❌ Impossible de récupérer la playlist.");
      }

      await interaction.editReply(`📜 **Téléchargement de ${playlist.items.length} musiques...** 🎶`);

      let addedCount = 0;
      let serverQueue = queue.get(interaction.guildId);
      let isPlaying = serverQueue && serverQueue.songs.length > 0;

      // 🎵 **2. Télécharger chaque musique individuellement et l'ajouter immédiatement**
      for (const video of playlist.items) {
        const safeTitle = sanitizeTitle(video.title);
        const fileName = `${safeTitle} - ${video.id}.mp3`; // 🔥 Format propre avec ID YouTube
        const expectedFilePath = path.join(musicFolder, fileName);

        console.log(`🔍 Vérification du fichier : ${expectedFilePath}`);

        // 📂 **Vérifier si la musique est déjà téléchargée**
        if (fs.existsSync(expectedFilePath)) {
          console.log(`✅ ${safeTitle} déjà téléchargé.`);
          await addToQueue(interaction, { filePath: expectedFilePath, title: safeTitle });
          addedCount++;

          // 🚀 Démarrer la lecture si rien ne joue encore
          if (!isPlaying) {
            isPlaying = true;
            playMusic(interaction, interaction.guildId);
          }

          // ✅ Mettre à jour Discord avec la musique ajoutée
          await interaction.editReply(`✅ **${safeTitle}** ajouté à la queue ! 🎶`);
          continue;
        }

        // ⏬ **Télécharger la musique et attendre la fin avant de passer à la suivante**
        try {
          console.log(`⏬ Téléchargement de : ${safeTitle}`);
          const actualFilePath = await downloadMusic(video.url, safeTitle, video.id, musicFolder);

          console.log(`📂 Fichier téléchargé : ${actualFilePath}`);
          await addToQueue(interaction, { filePath: actualFilePath, title: safeTitle });
          addedCount++;

          // 🚀 Démarrer la lecture dès qu'une musique est prête
          if (!isPlaying) {
            isPlaying = true;
            playMusic(interaction, interaction.guildId);
          }

          // ✅ Mettre à jour Discord après chaque ajout
          await interaction.editReply(`✅ **${safeTitle}** téléchargé et ajouté à la queue ! 🎶`);
        } catch (error) {
          console.error(`❌ Erreur lors du téléchargement de ${safeTitle}`, error);
        }
      }

      // 📜 **Confirmation finale**
      await interaction.editReply(`🎉 **Playlist terminée ! ${addedCount} musiques ajoutées.** 🎶`);

    } catch (error) {
      console.error(error);
      interaction.editReply("❌ Erreur lors du chargement de la playlist.");
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

/**
 * 📥 **Télécharge une musique avec yt-dlp et retourne son chemin**
 */
function downloadMusic(url, title, videoId, folder) {
  return new Promise((resolve, reject) => {
    const safeTitle = sanitizeTitle(title);
    const outputFileName = `${safeTitle} - ${videoId}.mp3`; // 🔥 Format uniforme
    const outputPath = path.join(folder, outputFileName);

    const command = `yt-dlp -x --audio-format mp3 --audio-quality 5 --force-overwrites --no-playlist --concurrent-fragments 5 --throttled-rate 0 \
-o "${outputPath}" "${url}"`;

    console.log(`🔄 Exécution de la commande : ${command}`);

    try {
      execSync(command, { stdio: "inherit" });

      // Vérifier si le fichier a bien été téléchargé
      if (fs.existsSync(outputPath)) {
        console.log(`📂 Fichier téléchargé trouvé : ${outputPath}`);
        resolve(outputPath);
      } else {
        console.error(`❌ Fichier introuvable après téléchargement : ${safeTitle}`);
        reject(new Error(`Fichier non trouvé : ${safeTitle}`));
      }
    } catch (error) {
      console.error(`❌ Erreur lors du téléchargement de ${safeTitle}:`, error);
      reject(error);
    }
  });
}
