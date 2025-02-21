import { SlashCommandBuilder } from "discord.js";
import { queue } from "../musicQueue.js";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Affiche la file d'attente de lecture"),

  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return interaction.reply({ content: "🎵 Aucune musique dans la queue.", ephemeral: true });
    }

    // 📜 Affichage limité aux 20 premiers morceaux
    const maxSongsToShow = 20;
    const songList = serverQueue.songs
      .slice(0, maxSongsToShow)
      .map((song, index) => 
        index === 0 
          ? `🎵 **${index + 1}. ${song.title}** *(En cours de lecture...)*` // Ajout du 🎵 sur la 1ère musique
          : `${index + 1}. **${song.title}**`
      )
      .join("\n");

    // 📌 Indiquer s'il y a plus de morceaux dans la queue
    const remainingSongs = serverQueue.songs.length - maxSongsToShow;
    const extraMessage = remainingSongs > 0 ? `\n🔽 ...et ${remainingSongs} autres musiques.` : "";

    // 🎶 Répondre avec la queue formatée
    await interaction.reply(`📜 **Queue actuelle :**\n${songList}${extraMessage}`);
    
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // Supprime après 15 secondes
  },
};
