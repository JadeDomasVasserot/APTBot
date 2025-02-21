import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Reprend la musique mise en pause"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || !serverQueue.player) {
      return interaction.reply("🎵 Aucune musique en pause.");
    }

    serverQueue.player.unpause();
    interaction.reply("▶️ **Musique reprise !**");
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
