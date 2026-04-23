FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages rapidocr-onnxruntime opencv-python-headless Pillow

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

RUN chmod +x /app/scripts/entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

CMD ["/app/scripts/entrypoint.sh"]
