import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");


export default {
  data: new SlashCommandBuilder()
    .setName("deleteplaylist")
    .setDescription("Supprime une playlist enregistrée")
    .addStringOption(option =>
      option.setName("nom").setDescription("Nom de la playlist à supprimer").setRequired(true)
    ),

  async execute(interaction) {
    const playlistName = interaction.options.getString("nom");
    const userId = interaction.user.id;

    if (!fs.existsSync(playlistsFile)) {
      return interaction.reply("❌ Aucune playlist sauvegardée !");
    }

    let playlists = JSON.parse(fs.readFileSync(playlistsFile));
    if (!playlists[userId] || !playlists[userId][playlistName]) {
      return interaction.reply(`❌ Playlist "${playlistName}" introuvable.`);
    }

    delete playlists[userId][playlistName];

    fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));

    interaction.reply(`🗑️ **Playlist "${playlistName}" supprimée avec succès !**`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
