import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { queue } from "../musicQueue.js";
import { fileURLToPath } from "url";

// Définir __dirname en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");

export default {
  data: new SlashCommandBuilder()
    .setName("saveplaylist")
    .setDescription("Sauvegarde la queue actuelle en tant que playlist personnalisée")
    .addStringOption(option =>
      option.setName("nom").setDescription("Nom de la playlist").setRequired(true)
    ),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return interaction.reply("❌ La queue est vide, impossible de sauvegarder !");
    }

    const playlistName = interaction.options.getString("nom");
    const userId = interaction.user.id;

    let playlists = {};
    if (fs.existsSync(playlistsFile)) {
      playlists = JSON.parse(fs.readFileSync(playlistsFile));
    }

    if (!playlists[userId]) playlists[userId] = {};
    playlists[userId][playlistName] = serverQueue.songs;

    fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));

    interaction.reply(`✅ **Playlist "${playlistName}" sauvegardée avec ${serverQueue.songs.length} musiques !**`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
