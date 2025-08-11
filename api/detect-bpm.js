// Importa as bibliotecas necessárias
const ytdl = require('ytdl-core');
const MusicTempo = require('music-tempo');
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

    // --- INÍCIO DA CORREÇÃO ---
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
    // --- FIM DA CORREÇÃO ---
    
    audioStream.pipe(writer);

    await new Promise((resolve, reject) => {
      // O evento 'close' é acionado quando o stream é destruído ou finalizado
      writer.on('close', resolve); 
      writer.on('error', reject);
    });

    // Lê o arquivo de áudio salvo para análise
    const audioData = fs.readFileSync(tempFilePath);
    
    if (audioData.length === 0) {
        throw new Error("Arquivo de áudio está vazio, possivelmente devido a um erro no download.");
    }

    const tempo = new MusicTempo(audioData);
    
    // Remove o arquivo temporário após a análise
    fs.unlinkSync(tempFilePath);

    // Envia o BPM encontrado de volta para o frontend
    res.status(200).json({ bpm: tempo.tempo });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: 'Falha ao analisar o áudio. Tente uma música diferente.' });
  }
};
