document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos da página (sem alterações) ---
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const audioControls = document.getElementById('audio-controls');
    const playBtn = document.getElementById('play-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingDiv = document.getElementById('loading');
    const bpmResultDiv = document.getElementById('bpm-result');
    
    let audioBuffer = null;

    // --- Configuração do WaveSurfer (sem alterações) ---
    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#b3b3b3',
        progressColor: '#1db954',
        height: 128,
        responsive: true,
        barWidth: 3,
        barRadius: 3
    });

    // --- Carregamento do arquivo e do WaveSurfer (sem alterações) ---
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
        audioBuffer = buffer;
        loadingDiv.classList.add('hidden');
        audioControls.classList.remove('hidden');
        fileLabel.textContent = "Escolher outro arquivo";
    });

    playBtn.addEventListener('click', () => {
        wavesurfer.playPause();
    });

    // --- LÓGICA DE ANÁLISE DE BPM TOTALMENTE REFEITA COM AUBIO.JS ---
    analyzeBtn.addEventListener('click', () => {
        if (!audioBuffer) return;

        // Prepara a interface para a análise
        loadingDiv.textContent = 'Analisando BPM...';
        loadingDiv.classList.remove('hidden');
        bpmResultDiv.classList.add('hidden');
        audioControls.classList.add('hidden');

        // A Aubio.js usa Promises, então encapsulamos em uma função async
        const runAnalysis = async () => {
            try {
                // 1. Inicia o módulo da Aubio.js (ela usa WebAssembly)
                const aubio = await Aubio(); 
                
                // 2. Define o tamanho dos blocos de áudio que vamos analisar
                const bufferSize = 4096;
                const hopSize = 512;

                // 3. Cria o objeto detector de batidas (Tempo)
                const tempo = new aubio.Tempo(bufferSize, hopSize, audioBuffer.sampleRate);
                
                // 4. Pega os dados do canal esquerdo do áudio
                const channelData = audioBuffer.getChannelData(0);

                // 5. Analisa o áudio em pequenos pedaços (blocos)
                let currentHop = 0;
                const beats = [];
                while (currentHop + hopSize < channelData.length) {
                    const segment = channelData.slice(currentHop, currentHop + hopSize);
                    const isBeat = tempo.do(segment); // Processa o segmento
                    if (isBeat) {
                        beats.push(tempo.getLastMs() / 1000); // Guarda a posição da batida
                    }
                    currentHop += hopSize;
                }

                if (tempo.getBpm() === 0 || beats.length < 5) {
                   throw new Error("Não foram encontradas batidas suficientes para uma análise confiável.");
                }

                // 6. Pega o resultado final do BPM
                const bpm = Math.round(tempo.getBpm());
                bpmResultDiv.innerHTML = `BPM: <span>${bpm}</span>`;
                bpmResultDiv.classList.remove('hidden');

            } catch (error) {
                console.error('Erro ao analisar com Aubio.js:', error);
                bpmResultDiv.innerHTML = 'Não foi possível detectar o BPM.';
                bpmResultDiv.classList.remove('hidden');
            } finally {
                // Restaura a interface após a análise
                loadingDiv.classList.add('hidden');
                audioControls.classList.remove('hidden');
            }
        };

        // Roda a função de análise que acabamos de criar
        runAnalysis();
    });
});
