import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { queue, playMusic } from "./musicQueue.js"; // Importation des fonctions du bot

export function getMusicControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pause_resume")
      .setLabel("⏯ Pause/Play")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("skip")
      .setLabel("⏭ Skip")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("loop")
      .setLabel("🔁 Loop")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("shuffle")
      .setLabel("🔀 Shuffle")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("queue")
      .setLabel("🍒 Queue")
      .setStyle(ButtonStyle.Secondary)
  );
}

// 📌 Gestion des interactions des boutons
export async function handleMusicButtons(interaction) {
  console.log("🔘 Interaction de bouton détectée");

  const guildId = interaction.guildId;
  if (!queue.has(guildId)) {
    return interaction.reply({ content: "❌ Aucune musique en cours.", ephemeral: true });
  }

  const serverQueue = queue.get(guildId);
  if (!serverQueue || !serverQueue.player) {
    return interaction.reply({ content: "❌ Aucune musique en cours ou problème avec le lecteur.", ephemeral: true });
  }

  try {
    // 📌 Déférer l'interaction pour éviter l'expiration
    await interaction.deferUpdate();

    let responseMessage = "";

    switch (interaction.customId) {
      case "pause_resume":
        if (serverQueue.player.state.status === "playing") {
          serverQueue.player.pause();
          responseMessage = "⏸ Musique en pause : " + serverQueue.songs[0].title;
        } else {
          serverQueue.player.unpause();
          responseMessage = "▶️ Musique reprise : " + serverQueue.songs[0].title;
        }
        break;

      case "skip":
        if (serverQueue.songs.length > 1) {
          serverQueue.songs.shift();
          playMusic(interaction, guildId);
          responseMessage = "⏭ Musique suivante : " + serverQueue.songs[0].title;
        } else {
          responseMessage = "❌ Aucune musique suivante : " + serverQueue.songs[0].title;
        }
        break;

      case "loop":
        serverQueue.loop = !serverQueue.loop;
        responseMessage = serverQueue.loop ? "🔁 Mode loop activé." : "🔁 Mode loop désactivé.";
        break;

      case "shuffle":
        if (serverQueue.songs.length > 1) {
            const nowPlaying = serverQueue.songs[0]; // 🎵 Garde la musique en cours
            const shuffledSongs = serverQueue.songs.slice(1).sort(() => Math.random() - 0.5); // 🔀 Mélange le reste
            serverQueue.songs = [nowPlaying, ...shuffledSongs]; // 🔁 Remet la musique en cours en première position
        }
        responseMessage = "🔀 Playlist mélangée (la musique en cours reste en tête).";
        break;
      

      case "queue":
        const maxSongsToShow = 10;
        const songList = serverQueue.songs
        .slice(0, maxSongsToShow)
        .map((song, index) => index === 0 ? `🎵 **${index + 1}. ${song.title}** *(En cours de lecture...)*` : `${index + 1}. **${song.title}**`)
        .join("\n");
    
        const remainingSongs = serverQueue.songs.length - maxSongsToShow;
        const extraMessage = remainingSongs > 0 ? `\n🔽 ...et ${remainingSongs} autres musiques.` : "";
    
        responseMessage = `📜 **Queue actuelle :**\n${songList}${extraMessage}`;
        break;
    }

    // ✅ Mettre à jour uniquement le message actuel avec les boutons
    await interaction.message.edit({ content: responseMessage, components: [getMusicControls()] });

   
  } catch (error) {
    console.error("❌ Erreur lors du traitement du bouton :", error);
  }
}
