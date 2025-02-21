import { SlashCommandBuilder } from "discord.js";
import os from "os";
import process from "process";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Affiche les statistiques du bot"),

  async execute(interaction) {
    const client = interaction.client;

    // Calcul de l'uptime en jours, heures, minutes et secondes
    let totalSeconds = process.uptime();
    let days = Math.floor(totalSeconds / 86400);
    let hours = Math.floor((totalSeconds % 86400) / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);

    const uptime = `${days}j ${hours}h ${minutes}m ${seconds}s`;

    // Infos CPU et mémoire
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const cpuLoad = os.loadavg()[0].toFixed(2); // Charge CPU sur la dernière minute

    // Informations sur le bot
    const stats = [
      `📊 **Statistiques du bot :**`,
      `🔹 **Uptime :** ${uptime}`,
      `💾 **Mémoire utilisée :** ${memoryUsage} MB`,
      `⚙️ **Charge CPU :** ${cpuLoad}%`,
      `🌍 **Serveurs :** ${client.guilds.cache.size}`,
      `👥 **Utilisateurs :** ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`,
      `🖥️ **OS :** ${os.type()} (${os.arch()})`,
      `🛠️ **Node.js :** ${process.version}`,
      `🤖 **Version du bot :** 1.0.0`
    ].join("\n");

    await interaction.reply(stats);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
