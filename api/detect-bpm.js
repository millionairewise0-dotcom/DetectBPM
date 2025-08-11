const ytdl = require('ytdl-core');
const { bpm } = require('bpm-detective');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Função principal que a Vercel irá executar
module.exports = async (req, res) => {
  // Permite que seu site (frontend) se comunique com esta função
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { youtubeUrl } = req.body;

  if (!youtubeUrl || !ytdl.validateURL(youtubeUrl)) {
    return res.status(400).json({ error: 'URL do YouTube inválida.' });
  }

  try {
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
    const writer = fs.createWriteStream(tempFilePath);
    const audioStream = ytdl(youtubeUrl, { quality: 'lowestaudio' });

    // Limita o download para 5MB para evitar o tempo limite da Vercel
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    let receivedBytes = 0;

    audioStream.on('data', (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_SIZE_BYTES) {
        console.log(`Limite de ${MAX_SIZE_MB}MB atingido, parando o download.`);
        audioStream.destroy(); // Para o download
      }
    });

    await new Promise((resolve, reject) => {
      audioStream.pipe(writer);
      // O evento 'close' é acionado quando o stream é destruído ou finalizado
      writer.on('close', resolve); 
      writer.on('error', reject);
    });

    const fileBuffer = fs.readFileSync(tempFilePath);
    
    if (fileBuffer.length === 0) {
        throw new Error("Arquivo de áudio está vazio, possivelmente devido a um erro no download.");
    }

    // Usa a nova biblioteca para detectar o BPM
    const bpmValue = await bpm(fileBuffer);
    
    // Remove o arquivo temporário
    fs.unlinkSync(tempFilePath);

    // Envia o resultado
    res.status(200).json({ bpm: bpmValue });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: 'Falha ao analisar o áudio. A música pode não ter uma batida clara ou o formato não é suportado.' });
  }
};
