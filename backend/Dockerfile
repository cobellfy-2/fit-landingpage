# backend/Dockerfile
# Wir starten mit einer leichtgewichtigen Node.js-Umgebung
FROM node:18-alpine

# Erstellt ein Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiert zuerst nur die package.json und installiert Abhängigkeiten (z.B. Express)
COPY package*.json ./
RUN npm install

# Kopiert deinen restlichen Backend-Code (server.js etc.)
COPY . .

# Öffnet den Port, auf dem dein Node-Server intern läuft
EXPOSE 3000

# Der Befehl, der ausgeführt wird, wenn der Container startet
CMD ["node", "server.js"]

