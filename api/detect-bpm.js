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
    // Cria um caminho para um arquivo temporário onde o áudio será salvo
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
    
    // Baixa o áudio do YouTube
    const audioStream = ytdl(youtubeUrl, { quality: 'lowestaudio' });

    // Salva o stream de áudio no arquivo temporário
    const writer = fs.createWriteStream(tempFilePath);
    audioStream.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Lê o arquivo de áudio salvo para análise
    const audioData = fs.readFileSync(tempFilePath);
    const tempo = new MusicTempo(audioData);
    
    // Remove o arquivo temporário após a análise
    fs.unlinkSync(tempFilePath);

    // Envia o BPM encontrado de volta para o frontend
    res.status(200).json({ bpm: tempo.tempo });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: 'Falha ao analisar o áudio.' });
  }
};
