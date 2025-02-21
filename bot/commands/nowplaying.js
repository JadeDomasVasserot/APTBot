import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Affiche la musique en cours de lecture"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || !serverQueue.songs.length) {
      return interaction.reply("🎵 Aucune musique en cours de lecture.");
    }

    const currentSong = serverQueue.songs[0];
    interaction.reply(`🎶 **Musique en cours :** ${currentSong.title}`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },

};
