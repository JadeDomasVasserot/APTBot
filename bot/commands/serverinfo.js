import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Affiche les informations du serveur actuel"),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner(); // Récupérer le propriétaire du serveur

    // Calcul de la date de création
    const creationDate = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;

    // Récupération des informations
    const serverInfo = [
      `📜 **Nom du serveur :** ${guild.name}`,
      `🆔 **ID du serveur :** ${guild.id}`,
      `👑 **Propriétaire :** ${owner.user.tag} (<@${owner.id}>)`,
      `👥 **Nombre de membres :** ${guild.memberCount}`,
      `🔰 **Nombre de rôles :** ${guild.roles.cache.size}`,
      `💬 **Nombre de salons textuels :** ${guild.channels.cache.filter(c => c.type === 0).size}`,
      `🔊 **Nombre de salons vocaux :** ${guild.channels.cache.filter(c => c.type === 2).size}`,
      `🚀 **Boosts :** ${guild.premiumSubscriptionCount} (Niveau ${guild.premiumTier})`,
      `📅 **Créé le :** ${creationDate}`
    ].join("\n");

    await interaction.reply(`🌍 **Informations sur le serveur :**\n${serverInfo}`);
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (error) {
        console.log("⚠ Impossible de supprimer le message (peut-être déjà supprimé).");
      }
    }, 15000); // 30 sec (15000 ms)
  },
};
