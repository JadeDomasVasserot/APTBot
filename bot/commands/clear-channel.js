import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear-channel")
    .setDescription("Supprime tous les messages du salon actuel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;

    try {
      let messages;
      do {
        messages = await channel.messages.fetch({ limit: 100 }); // Récupère jusqu'à 100 messages
        await channel.bulkDelete(messages, true); // Supprime en masse
      } while (messages.size >= 2); // Continue tant qu'il y a encore des messages à supprimer

      await interaction.editReply("✅ Salon entièrement nettoyé !");
    } catch (error) {
      console.error("❌ Erreur lors du clear :", error);
      await interaction.editReply("❌ Impossible de supprimer les messages.");
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
