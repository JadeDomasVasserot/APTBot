# Utiliser une image Node.js officielle
FROM node:18

# Installer FFmpeg
RUN apt-get update && apt-get install -y ffmpeg curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

RUN yt-dlp -U

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers du projet
COPY package*.json ./
RUN npm install

# Copier tous les fichiers du bot
COPY . .

# Démarrer le bot
CMD ["node", "/app/bot/index.js"]
