import { SlashCommandBuilder } from "discord.js";
import { queue, clearBotMessages } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Arrête la lecture et vide la queue"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue) {
      return interaction.reply("🎵 Aucune musique en cours de lecture.");
    }

    serverQueue.songs = []; // Vide la queue
    serverQueue.player.stop(); // Arrête la lecture
    serverQueue.connection.destroy(); // Déconnecte le bot

    queue.delete(interaction.guildId); // Supprime la queue du serveur
    interaction.reply("⏹️ **Musique arrêtée, queue vidée et bot déconnecté.**");
    await clearBotMessages(interaction.channel);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
