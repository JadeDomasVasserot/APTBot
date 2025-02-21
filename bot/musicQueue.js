import { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
import { getMusicControls } from "./musicControls.js"; // 🔥 Import des boutons

export const queue = new Map();

export async function addToQueue(interaction, song) {
  const guildId = interaction.guildId;
  let serverQueue = queue.get(guildId);

  if (!serverQueue) {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    serverQueue = {
      connection,
      player,
      songs: [],
      loop: false,
      volume: 1,
      autoplay: false,
      destroyed: false,
      playMessage: null,
      isPlaying: false, // ✅ Ajout d'un indicateur pour éviter les doublons
    };

    queue.set(guildId, serverQueue);
    connection.subscribe(player);
  }

  serverQueue.songs.push(song);

  
}

export async function playMusic(interaction, guildId) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || serverQueue.songs.length === 0) {
    console.log("🚨 Aucune musique dans la queue, suppression de la file.");
    return;
  }

  const song = serverQueue.songs[0];

  try {
    console.log(`🎵 Lecture en cours : ${song.title}`);

    const resource = createAudioResource(song.filePath);
    serverQueue.player.play(resource);

    // 🔄 **Mise à jour ou recréation du message du lecteur**
    if (serverQueue.playMessage) {
      try {
        await serverQueue.playMessage.edit({
          content: `▶️ Lecture de **${song.title}** 🎶`,
          components: [getMusicControls()],
        });
      } catch (error) {
        console.log("⚠ Impossible de mettre à jour le message, suppression et recréation...");
        try {
          await serverQueue.playMessage.delete();
        } catch (deleteError) {
          console.log("⚠ Message déjà supprimé, pas besoin de le supprimer");
        }
        serverQueue.playMessage = await interaction.channel.send({
          content: `▶️ Lecture de **${song.title}** 🎶`,
          components: [getMusicControls()],
        });
      }
    } else {
      serverQueue.playMessage = await interaction.channel.send({
        content: `▶️ Lecture de **${song.title}** 🎶`,
        components: [getMusicControls()],
      });
    }

    serverQueue.isPlaying = true;

    serverQueue.player.once(AudioPlayerStatus.Idle, async () => {
      console.log(`🔄 Fin de la musique : ${song.title}`);

      setTimeout(() => {
        if (serverQueue.songs.length > 1) {
          console.log(`✅ Musique suivante : ${serverQueue.songs[1].title}`);
          serverQueue.songs.shift();
          playMusic(interaction, guildId);
        } else {
          console.log("❌ Plus de musique dans la queue, en attente d'ajouts...");

          setTimeout(async () => {
            if (serverQueue.songs.length === 0) {
              console.log("🛑 Aucune nouvelle musique ajoutée, fermeture de la connexion.");
              if (!serverQueue.destroyed) {
                serverQueue.destroyed = true;
                serverQueue.connection.destroy();
                queue.delete(guildId);
                // ✅ Nettoyage des messages du bot avant la déconnexion
                await clearBotMessages(interaction.channel);
                
                // ✅ **Supprimer le dernier message de lecture**
                if (serverQueue.playMessage) {
                  try {
                    await serverQueue.playMessage.delete();
                  } catch (error) {
                    console.log("⚠ Impossible de supprimer le message final");
                  }
                }
              }
            }
          }, 15000);
        }
      }, 1000);
    });

    serverQueue.player.on("error", async (error) => {
      console.error("❌ Erreur lors de la lecture :", error);
      if (serverQueue.playMessage) {
        await serverQueue.playMessage.edit({ content: "❌ Erreur lors de la lecture !", components: [] });
      }
    });

  } catch (error) {
    console.error("❌ Erreur lors de la lecture :", error);
    if (serverQueue.playMessage) {
      await serverQueue.playMessage.edit({ content: "❌ Erreur lors de la lecture !", components: [] });
    }
  }
}
export async function clearBotMessages(channel) {
  if (!channel) return;
  try {
    let messages;
    do {
      messages = await channel.messages.fetch({ limit: 100 });
      const botMessages = messages.filter(msg => msg.author.bot); // 🔥 Filtre uniquement les messages du bot
      await channel.bulkDelete(botMessages, true);
    } while (messages.size > 0);
    await sendHelpMessage(channel); 
    console.log("✅ Messages du bot nettoyés avant déconnexion !");
  } catch (error) {
    console.error("❌ Impossible de supprimer les messages :", error);
  }
}
// 📌 Fonction pour envoyer le message /help
export async function sendHelpMessage(channel) {
  try {
    const embed = {
      color: 0x5865F2,
      title: "📜 Liste des commandes",
      description: "Voici toutes les commandes disponibles sur ce bot :",
      fields: [
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
        { name: "🗑️ **Clear**", value: 
          "`/clear-channel` - Supprime tous les messages du salon actuel\n" 
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
      ],
      footer: {
        text: "Besoin d'aide ? Contacte un administrateur.",
        icon_url: channel.client.user.displayAvatarURL()
      }
    };

    const helpMessage = await channel.send({ embeds: [embed] });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du message d'aide :", error);
  }
}

