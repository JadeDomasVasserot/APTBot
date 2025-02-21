import { SlashCommandBuilder } from "discord.js";
import { queue, playMusic, clearBotMessages } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Passe à la musique suivante"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return interaction.reply("🎵 Aucune musique en cours de lecture.");
    }

    if (!serverQueue.loop) {
      serverQueue.songs.shift(); // ✅ Supprime la musique actuelle avant d'arrêter
    }

    if (serverQueue.songs.length > 0) {
      interaction.reply("⏭️ **Musique suivante !**");
      playMusic(interaction, interaction.guildId); // ✅ Joue la suivante immédiatement
    } else {
      interaction.reply("❌ Plus de musique dans la queue, arrêt de la lecture.");
      serverQueue.connection.destroy();
      queue.delete(interaction.guildId);
      await clearBotMessages(interaction.channel);
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
