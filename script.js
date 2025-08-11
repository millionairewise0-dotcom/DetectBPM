document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const audioControls = document.getElementById('audio-controls');
    const playBtn = document.getElementById('play-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingDiv = document.getElementById('loading');
    const bpmResultDiv = document.getElementById('bpm-result');
    
    let audioBuffer = null; // Variável para guardar o áudio decodificado

    // Inicializa o WaveSurfer
    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#b3b3b3',
        progressColor: '#1db954',
        height: 128,
        responsive: true,
        barWidth: 3,
        barRadius: 3
    });

    // Evento de seleção de arquivo
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reseta a interface para um novo arquivo
        bpmResultDiv.classList.add('hidden');
        audioControls.classList.add('hidden');
        loadingDiv.textContent = 'Carregando áudio...';
        loadingDiv.classList.remove('hidden');

        // Carrega o áudio no WaveSurfer
        wavesurfer.load(URL.createObjectURL(file));
    });

    // MUDANÇA CRÍTICA: Evento 'load' do wavesurfer
    // É disparado QUANDO o áudio é carregado e decodificado.
    wavesurfer.on('load', (buffer) => {
        audioBuffer = buffer; // Salva o buffer do áudio
        loadingDiv.classList.add('hidden'); // Esconde o "Carregando..."
        audioControls.classList.remove('hidden'); // Mostra os botões "Play" e "Analisar"
        fileLabel.textContent = "Escolher outro arquivo"; // Atualiza o texto do botão
    });

    // NOVO: Evento de clique para tocar/pausar
    playBtn.addEventListener('click', () => {
        wavesurfer.playPause();
    });

    // NOVO: Evento de clique para analisar o BPM
    analyzeBtn.addEventListener('click', async () => {
        if (!audioBuffer) return; // Garante que o áudio foi carregado

        loadingDiv.textContent = 'Analisando BPM...';
        loadingDiv.classList.remove('hidden');
        bpmResultDiv.classList.add('hidden');
        audioControls.classList.add('hidden'); // Esconde botões durante a análise

        try {
            // A análise agora é chamada aqui
            const { tempo } = await webAudioBeatDetector.analyze(audioBuffer);
            const bpm = Math.round(tempo);
            
            bpmResultDiv.innerHTML = `BPM: <span>${bpm}</span>`;
            bpmResultDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao analisar o BPM:', error);
            bpmResultDiv.innerHTML = 'Não foi possível detectar o BPM.';
            bpmResultDiv.classList.remove('hidden');
        } finally {
            // Garante que a interface seja restaurada após a análise
            loadingDiv.classList.add('hidden');
            audioControls.classList.remove('hidden');
        }
    });
});
