import "dotenv/config";
import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleMusicButtons } from "./musicControls.js"; // Import des boutons


// Définir __dirname manuellement en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,  // Intents pour la musique
      GatewayIntentBits.GuildMembers,      // Important pour les membres (si besoin)
      GatewayIntentBits.GuildPresences     // Important pour suivre les statuts (si besoin)
    ],
  });

let lastChannel = null;

client.commands = new Collection();
// Définir l'API Discord REST
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)
// Charger les commandes
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
const commandsArray = [];
for (const file of commandFiles) {
    const command = await import(`file://${path.join(commandsPath, file)}`);
    if (command.default && command.default.data) {
        client.commands.set(command.default.data.name, command.default);
        commandsArray.push(command.default.data.toJSON()); // Ajouter la commande au tableau
    } else {
        console.warn(`⚠️ Commande invalide : ${file}`);
    }
}
console.log(`✅ ${client.commands.size} commandes chargées`);
(async () => {
    try {
      console.log("🔄 Mise à jour des commandes...");
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsArray });
      console.log("✅ Commandes enregistrées avec succès !");
    } catch (error) {
      console.error("❌ Erreur lors de l’enregistrement des commandes :", error);
    }
  })();
// Enregistrement des commandes auprès de l'API Discord

client.on("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    await handleMusicButtons(interaction); // Gérer les interactions des boutons
  }
  if (!interaction.isCommand()) return;
  try {
      const command = client.commands.get(interaction.commandName);
      if (command) {
          await command.execute(interaction);
      }
  } catch (error) {
      console.error("Erreur :", error);
      await interaction.reply({ content: "❌ Erreur interne", ephemeral: true });
  }
});


client.login(process.env.TOKEN);
