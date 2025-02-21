import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Met en pause la musique actuelle"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || !serverQueue.player) {
      return interaction.reply("🎵 Aucune musique en cours de lecture.");
    }

    serverQueue.player.pause();
    interaction.reply("⏸️ **Musique mise en pause.** Utilise `/resume` pour reprendre.");
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
