import { SlashCommandBuilder, EmbedBuilder } from "discord.js";;

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes disponibles (sauf /likeplaylist)"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#5865F2") // Couleur principale
      .setTitle("📜 Liste des commandes")
      .setDescription("Voici toutes les commandes disponibles sur ce bot :")
      .addFields(
        { name: "🎵 **Musique**", value: 
          "`/play <titre/lien>` - Joue une musique YouTube\n" +
          "`/play-now <titre/lien>` - Joue une musique Youtube maintenant\n" +
          "`/play-next <titre/lien>` - Joue une musique YouTube après celle en cours\n" +
          "`/autoplay - Active ou désactive la lecture automatique de musiques du dossier music\n" +
          "`/queue` - Affiche la file d'attente\n" +
          "`/skip` - Passe à la musique suivante\n" +
          "`/stop` - Arrête la lecture et vide la queue\n" +
          "`/pause` - Met la musique en pause\n" +
          "`/resume` - Reprend la musique\n" +
          "`/nowplaying` - Affiche la musique en cours\n"
        },
        { name: "📂 **Playlists YouTube**", value: 
          "`/playlist <URL YouTube>` - Joue une playlist YouTube\n" 
        },
        { name: "🗑️ **Clear*", value: 
          "`/clear-channel - Supprime tous les messages du salon actuel\n" 
        },
        { name: "📌 **Playlists personnalisées**", value: 
          "`/saveplaylist <nom>` - Sauvegarde la queue actuelle\n" +
          "`/loadplaylist <nom>` - Charge une playlist enregistrée\n" +
          "`/deleteplaylist <nom>` - Supprime une playlist\n" +
          "`/myplaylists` - Liste tes playlists enregistrées\n" +
          "`/listplaylist` - Liste les musiques d'une playlist\n" +
          "`/addtomultipleplaylists` - Ajoute une musique à une ou plusieurs playlist\n"
        },
        { name: "🌍 **Informations**", value: 
          "`/info` - Affiche les infos du bot\n" +
          "`/ping` - Vérifie la latence du bot\n" +
          "`/stats` - Affiche les statistiques du bot\n" +
          "`/serverinfo` - Affiche les infos du serveur"
        }
      )
      .setFooter({ text: "Besoin d'aide ? Contacte un administrateur.", iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
