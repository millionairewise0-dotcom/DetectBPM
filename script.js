document.addEventListener('DOMContentLoaded', () = {
    const fileInput = document.getElementById('file-input');
    const loadingDiv = document.getElementById('loading');
    const bpmResultDiv = document.getElementById('bpm-result');
    const waveformDiv = document.getElementById('waveform');

     Inicializa o WaveSurfer
    const wavesurfer = WaveSurfer.create({
        container '#waveform',
        waveColor '#b3b3b3',
        progressColor '#1db954',
        height 128,
        responsive true,
        barWidth 3,
        barRadius 3
    });

     Função para analisar o BPM
    const analyzeBPM = async (audioBuffer) = {
        loadingDiv.classList.remove('hidden');
        bpmResultDiv.classList.add('hidden');

        try {
            const { tempo } = await webAudioBeatDetector.analyze(audioBuffer);
            const bpm = Math.round(tempo);
            
            bpmResultDiv.innerHTML = `BPM span${bpm}span`;
            
            loadingDiv.classList.add('hidden');
            bpmResultDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao analisar o BPM', error);
            bpmResultDiv.innerHTML = 'Não foi possível detectar o BPM.';
            loadingDiv.classList.add('hidden');
            bpmResultDiv.classList.remove('hidden');
        }
    };

     Evento de seleção de arquivo
    fileInput.addEventListener('change', (event) = {
        const file = event.target.files[0];
        if (file) {
             Mostra a waveform
            wavesurfer.load(URL.createObjectURL(file));

             Quando o áudio estiver decodificado e pronto, analisamos o BPM
            wavesurfer.on('decode', (audioBuffer) = {
                analyzeBPM(audioBuffer);
            });
        }
    });
});