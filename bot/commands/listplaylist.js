import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Définir __dirname en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");

export default {
  data: new SlashCommandBuilder()
    .setName("listplaylist")
    .setDescription("Affiche les musiques d'une playlist enregistrée")
    .addStringOption(option =>
      option
        .setName("nom")
        .setDescription("Nom de la playlist")
        .setRequired(true)
    ),

  async execute(interaction) {
    const playlistName = interaction.options.getString("nom");
    const userId = interaction.user.id;

    if (!fs.existsSync(playlistsFile)) {
      return interaction.reply("❌ Aucune playlist enregistrée.");
    }

    const playlists = JSON.parse(fs.readFileSync(playlistsFile));

    if (!playlists[userId] || !playlists[userId][playlistName]) {
      return interaction.reply(`❌ La playlist **"${playlistName}"** n'existe pas.`);
    }

    const songs = playlists[userId][playlistName];

    if (songs.length === 0) {
      return interaction.reply(`📂 La playlist **"${playlistName}"** est vide.`);
    }

    // 📜 **Afficher seulement les 30 premières chansons**
    const maxSongs = 30;
    const displayedSongs = songs.slice(0, maxSongs);
    const songList = displayedSongs.map((song, index) => `${index + 1}. **${song.title}**`).join("\n");

    // 📝 Ajouter une indication s'il y a plus de 30 chansons
    const extraMessage = songs.length > maxSongs 
      ? `\n⚠️ Et ${songs.length - maxSongs} autres musiques...` 
      : "";

    await interaction.reply(`📜 **Musiques dans la playlist "${playlistName}" :**\n${songList}${extraMessage}`);

    // ⏳ Supprimer le message après 15 secondes
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000);
  },
};
