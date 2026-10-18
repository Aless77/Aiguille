# Image de développement unique pour web, scraper et les tâches ponctuelles.
# Les dépendances sont installées par le service « setup » dans un volume Docker,
# pour que rien ne soit installé sur le PC hôte.
FROM node:24-alpine

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
