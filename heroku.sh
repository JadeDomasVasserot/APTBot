
# deploy sur heroku
brew tap heroku/brew && brew install heroku

heroku login

# Variables de configuration
APP_NAME="aptbotdiscord"  # Nom de l'application Heroku
IMAGE_NAME="aptbotdiscord"  # Nom de l'image Docker
HEROKU_REGISTRY="registry.heroku.com"
HEROKU_PROCESS_TYPE="web"  # Type de processus (ex. web, worker)
PLATFORM="linux/amd64"  # Plateforme cible pour les builds (utile pour Apple Silicon)

# Fonction pour afficher les messages d'erreur et quitter
error_exit() {
    echo "Erreur : $1"
    exit 1
}

# Connexion au registre des containers Heroku
echo "Connexion au registre des containers Heroku..."
heroku container:login || error_exit "Échec de la connexion au registre Heroku."

# Création de l'application Heroku si elle n'existe pas déjà
echo "Création de l'application Heroku..."
heroku create $APP_NAME || echo "L'application $APP_NAME existe déjà."

# Construction de l'image Docker (compatible Apple Silicon ou autres plateformes)
echo "Construction de l'image Docker..."
if [[ "$(uname -s)" == "Darwin" ]]; then
    # Si le système est MacOS (Apple Silicon)
    docker buildx build --platform $PLATFORM -t $IMAGE_NAME . || error_exit "Échec de la construction de l'image Docker."
else
    # Pour Windows/Linux ou MacOS Intel
    docker build -t $IMAGE_NAME . || error_exit "Échec de la construction de l'image Docker."
fi

# Taguer l'image Docker pour le registre Heroku
echo "Taggage de l'image Docker pour le registre Heroku..."
docker tag $IMAGE_NAME $HEROKU_REGISTRY/$APP_NAME/$HEROKU_PROCESS_TYPE || error_exit "Échec du taggage de l'image Docker."

# Push de l'image Docker dans le registre Heroku
echo "Publication de l'image Docker dans le registre Heroku..."
docker push $HEROKU_REGISTRY/$APP_NAME/$HEROKU_PROCESS_TYPE || error_exit "Échec du push dans le registre Heroku."

# Configuration du stack container sur Heroku
echo "Configuration du stack container sur Heroku..."
heroku stack:set container -a $APP_NAME || error_exit "Échec de la configuration du stack container."

# Activation du container sur Heroku
echo "Activation du container sur Heroku..."
heroku container:release $HEROKU_PROCESS_TYPE -a $APP_NAME || error_exit "Échec de l'activation du container."

echo "Déploiement terminé avec succès !"

heroku logs --tail --app aptbotdiscord

