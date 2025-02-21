import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Supprime une musique de la queue")
    .addIntegerOption(option =>
      option
        .setName("position")
        .setDescription("Position de la musique à supprimer")
        .setRequired(true)
    ),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return interaction.reply("🎵 Aucune musique dans la queue.");
    }

    const position = interaction.options.getInteger("position");
    if (position < 1 || position > serverQueue.songs.length) {
      return interaction.reply("❌ Position invalide.");
    }

    const removedSong = serverQueue.songs.splice(position - 1, 1);
    interaction.reply(`🗑️ **${removedSong[0].title}** a été supprimé de la queue.`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
