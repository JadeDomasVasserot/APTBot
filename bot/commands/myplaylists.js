import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");

export default {
  data: new SlashCommandBuilder()
    .setName("myplaylists")
    .setDescription("Affiche la liste de tes playlists enregistrées"),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (!fs.existsSync(playlistsFile)) {
      return interaction.reply("❌ Aucune playlist enregistrée.");
    }

    const playlists = JSON.parse(fs.readFileSync(playlistsFile));
    if (!playlists[userId] || Object.keys(playlists[userId]).length === 0) {
      return interaction.reply("📂 Tu n'as aucune playlist enregistrée.");
    }

    const playlistList = Object.keys(playlists[userId]).map(name => `🎵 **${name}**`).join("\n");
    interaction.reply(`📂 **Tes playlists :**\n${playlistList}`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
