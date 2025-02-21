import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Mélange la file d'attente"),

  async execute(interaction) {
    await interaction.deferReply(); // ✅ Déférer pour éviter les erreurs Discord

    const serverQueue = queue.get(interaction.guildId);
    
    if (!serverQueue || serverQueue.songs.length <= 1) {
      return interaction.editReply("🎵 Pas assez de musiques pour mélanger la queue.");
    }

    console.log("🔀 Mélange de la queue en cours...");

    // ✅ Récupère la musique en cours et mélange le reste
    const currentSong = serverQueue.songs.shift();
    serverQueue.songs = shuffleArray(serverQueue.songs);
    serverQueue.songs.unshift(currentSong); // Remet la musique en cours en tête

    console.log("✅ Nouvelle queue après shuffle :", serverQueue.songs);

    await interaction.editReply("🔀 **Queue mélangée avec succès !** 🎶");
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};

// 🔄 **Fonction pour mélanger un tableau**
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
