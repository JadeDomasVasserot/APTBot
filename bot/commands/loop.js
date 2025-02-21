import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Active ou désactive la boucle sur la musique en cours"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || !serverQueue.songs.length) {
      return interaction.reply("🎵 Aucune musique en cours de lecture.");
    }

    serverQueue.loop = !serverQueue.loop;
    interaction.reply(serverQueue.loop ? "🔁 **Mode boucle activé !**" : "⏹️ **Mode boucle désactivé.**");
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
  
};
