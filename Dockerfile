FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages rapidocr-onnxruntime opencv-python-headless Pillow

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
