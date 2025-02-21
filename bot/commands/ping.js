import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Affiche la latence du bot"),

  async execute(interaction) {
    const sent = await interaction.reply({ content: "🏓 Calcul du ping...", fetchReply: true });
    
    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = interaction.client.ws.ping;

    await interaction.editReply(`🏓 **Pong !**\n⏳ **Latence du bot :** ${botLatency}ms\n📡 **Latence de l'API :** ${apiLatency}ms`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
