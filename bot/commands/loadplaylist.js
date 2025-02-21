import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer } from "@discordjs/voice";
import fs from "fs";
import path from "path";
import { queue, playMusic } from "../musicQueue.js"; // Assurez-vous que `playMusic` est bien importé
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playlistsFile = path.join(__dirname, "../playlists.json");

export default {
  data: new SlashCommandBuilder()
    .setName("loadplaylist")
    .setDescription("Charge et joue une playlist enregistrée")
    .addStringOption(option =>
      option.setName("nom").setDescription("Nom de la playlist à charger").setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply(); // ✅ Déférer pour éviter l'expiration de l'interaction

    const playlistName = interaction.options.getString("nom");
    const userId = interaction.user.id;

    if (!fs.existsSync(playlistsFile)) {
      return interaction.editReply("❌ Aucune playlist sauvegardée !");
    }

    const playlists = JSON.parse(fs.readFileSync(playlistsFile));
    if (!playlists[userId] || !playlists[userId][playlistName]) {
      return interaction.editReply(`❌ Playlist "${playlistName}" introuvable.`);
    }

    const songs = playlists[userId][playlistName];
    console.log(`📜 Chargement de la playlist "${playlistName}" contenant ${songs.length} musiques...`);

    let serverQueue = queue.get(interaction.guildId);
    
    if (!serverQueue) {
      const player = createAudioPlayer();
      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channelId,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      serverQueue = {
        connection,
        player,
        songs: [],
        loop: false,
        autoplay: false,
      };

      queue.set(interaction.guildId, serverQueue);
      connection.subscribe(player);
    }

    // ✅ Ajouter les musiques à la queue
    serverQueue.songs.push(...songs);
    console.log("🎶 Queue actuelle :", serverQueue.songs);

    await interaction.editReply(`🎶 **Playlist "${playlistName}" chargée avec ${songs.length} musiques !**`);

    // ✅ Démarrer la lecture si rien ne joue actuellement
    if (serverQueue.songs.length === songs.length) {
      console.log(`▶️ Démarrage de la playlist "${playlistName}"...`);
      playMusic(interaction, interaction.guildId);
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
