// script.js - VERSÃO FINAL
document.addEventListener('DOMContentLoaded', () => {
    console.log("Página carregada. Detector de BPM (versão final) iniciado.");

    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const audioControls = document.getElementById('audio-controls');
    const playBtn = document.getElementById('play-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingDiv = document.getElementById('loading');
    const bpmResultDiv = document.getElementById('bpm-result');
    
    let audioBuffer = null;
    
    // --- CORREÇÃO PRINCIPAL: Esperar a biblioteca Aubio carregar ---
    // Botão de análise começa desativado.
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Carregando Análise...';

    // Função que verifica se a biblioteca Aubio.js já está pronta
    const waitForAubio = setInterval(() => {
        if (window.Aubio) {
            console.log("Biblioteca Aubio.js carregada e pronta!");
            clearInterval(waitForAubio); // Para a verificação
            analyzeBtn.disabled = false; // Ativa o botão
            analyzeBtn.textContent = 'Analisar BPM';
        } else {
            console.log("Aguardando biblioteca Aubio.js...");
        }
    }, 200); // Verifica a cada 200ms

    // -----------------------------------------------------------------

    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#b3b3b3',
        progressColor: '#1db954',
        height: 128,
        responsive: true,
        barWidth: 3,
        barRadius: 3
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        bpmResultDiv.classList.add('hidden');
        audioControls.classList.add('hidden');
        loadingDiv.textContent = 'Carregando áudio...';
        loadingDiv.classList.remove('hidden');

        wavesurfer.load(URL.createObjectURL(file));
    });

    wavesurfer.on('load', (buffer) => {
        console.log("WaveSurfer carregou e decodificou o áudio com sucesso.");
        audioBuffer = buffer;
        loadingDiv.classList.add('hidden');
        audioControls.classList.remove('hidden');
        fileLabel.textContent = "Escolher outro arquivo";
    });

    wavesurfer.on('error', (err) => {
        console.error("Erro no WaveSurfer:", err);
    });

    playBtn.addEventListener('click', () => {
        wavesurfer.playPause();
    });

    analyzeBtn.addEventListener('click', () => {
        if (!audioBuffer) return;

        loadingDiv.textContent = 'Analisando BPM...';
        loadingDiv.classList.remove('hidden');
        bpmResultDiv.classList.add('hidden');
        audioControls.classList.add('hidden');
        
        const runAnalysis = async () => {
            try {
                // Agora, quando este código rodar, temos certeza que 'Aubio' existe
                const aubio = await Aubio();
                
                const bufferSize = 4096;
                const hopSize = 512;
                const tempo = new aubio.Tempo(bufferSize, hopSize, audioBuffer.sampleRate);
                const channelData = audioBuffer.getChannelData(0);

                let currentHop = 0;
                const beats = [];
                while (currentHop + hopSize < channelData.length) {
                    const segment = channelData.slice(currentHop, currentHop + hopSize);
                    const isBeat = tempo.do(segment);
                    if (isBeat) {
                        beats.push(tempo.getLastMs());
                    }
                    currentHop += hopSize;
                }
                
                const foundBpm = tempo.getBpm();
                if (foundBpm === 0 || beats.length < 5) {
                   throw new Error(`Análise falhou: Batidas insuficientes (${beats.length}) ou BPM zerado (${foundBpm}).`);
                }

                const bpm = Math.round(foundBpm);
                bpmResultDiv.innerHTML = `BPM: <span>${bpm}</span>`;
                bpmResultDiv.classList.remove('hidden');

            } catch (error) {
                console.error("ERRO DURANTE A ANÁLISE:", error);
                bpmResultDiv.innerHTML = 'Não foi possível detectar o BPM.';
                bpmResultDiv.classList.remove('hidden');
            } finally {
                loadingDiv.classList.add('hidden');
                audioControls.classList.remove('hidden');
            }
        };

        runAnalysis();
    });
});
