import { SlashCommandBuilder } from "discord.js";
import os from "os";

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Affiche des informations sur le bot"),

  async execute(interaction) {
    const client = interaction.client;
    
    // Calcul de l'uptime en heures, minutes et secondes
    const totalSeconds = process.uptime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const uptime = `${hours}h ${minutes}m ${seconds}s`;

    // Infos sur le bot
    const botInfo = [
      `🤖 **Nom :** ${client.user.username}`,
      `⚙️ **Version :** 1.0.0`,
      `👨‍💻 **Développeur :** TonNom`,
      `🌍 **Serveurs :** ${client.guilds.cache.size}`,
      `👥 **Utilisateurs :** ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`,
      `🕒 **Uptime :** ${uptime}`,
      `💾 **Mémoire utilisée :** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      `🖥️ **OS :** ${os.type()}`
    ].join("\n");

    await interaction.reply(`📊 **Informations sur le bot :**\n${botInfo}`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
    },
};
