// Configuração da API
// Para produção no Vercel, a URL será automaticamente /api/detect
// Para desenvolvimento local com Vercel CLI: const API_URL = 'http://localhost:3000/api/detect';
const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/detect'
    : '/api/detect';

// Classes de EPIs (ajuste conforme seu modelo treinado)
const EPI_CLASSES = {
    0: 'pessoa',
    1: 'orelha',
    2: 'protetores auriculares',
    3: 'rosto',
    4: 'protetor facial',
    5: 'máscara facial',
    6: 'pé',
    7: 'ferramenta',
    8: 'óculos',
    9: 'luvas',
    10: 'capacete',
    11: 'mãos',
    12: 'cabeça',
    13: 'roupa médica',
    14: 'sapatos',
    15: 'roupa de segurança',
    16: 'colete de segurança',
};

// EPIs obrigatórios (serão carregados do localStorage ou padrão)
let EPIS_OBRIGATORIOS = loadRequiredEPIs();

// EPIs que devem ser considerados para seleção (excluindo partes do corpo)
const EPIS_DISPONIVEIS = {
    10: 'capacete',
    8: 'óculos',
    5: 'máscara facial',
    9: 'luvas',
    16: 'colete de segurança',
    2: 'protetores auriculares',
    4: 'protetor facial',
    13: 'roupa médica',
    15: 'roupa de segurança',
    14: 'sapatos'
};

// Elementos DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const captureBtn = document.getElementById('captureBtn');
const statusBox = document.getElementById('status');
const resultsBox = document.getElementById('results');
const epiStatusBox = document.getElementById('epiStatus');

// Elementos de configuração
const toggleConfigBtn = document.getElementById('toggleConfig');
const configPanel = document.getElementById('configPanel');
const epiCheckboxes = document.getElementById('epiCheckboxes');
const saveConfigBtn = document.getElementById('saveConfig');
const selectAllBtn = document.getElementById('selectAll');
const deselectAllBtn = document.getElementById('deselectAll');
const configStatus = document.getElementById('configStatus');

let stream = null;
let isDetecting = false;

// Funções de gerenciamento de configuração
function loadRequiredEPIs() {
    const saved = localStorage.getItem('requiredEPIs');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao carregar EPIs salvos:', e);
        }
    }
    // Padrão: capacete, óculos, máscara facial
    return ['capacete', 'óculos', 'máscara facial'];
}

function saveRequiredEPIs(epis) {
    localStorage.setItem('requiredEPIs', JSON.stringify(epis));
    EPIS_OBRIGATORIOS = epis;
}

function initializeConfigPanel() {
    // Criar checkboxes para cada EPI disponível
    epiCheckboxes.innerHTML = '';
    
    Object.entries(EPIS_DISPONIVEIS).forEach(([classId, epiName]) => {
        const isChecked = EPIS_OBRIGATORIOS.includes(epiName);
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `epi-${classId}`;
        checkbox.value = epiName;
        checkbox.checked = isChecked;
        checkbox.className = 'epi-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `epi-${classId}`;
        label.textContent = epiName;
        label.className = 'epi-label';
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        epiCheckboxes.appendChild(checkboxContainer);
    });
}

function getSelectedEPIs() {
    const checkboxes = document.querySelectorAll('.epi-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Event listeners para configuração
toggleConfigBtn.addEventListener('click', () => {
    const isVisible = configPanel.style.display !== 'none';
    configPanel.style.display = isVisible ? 'none' : 'block';
    toggleConfigBtn.textContent = isVisible ? '⚙️ Configurar' : '❌ Fechar';
    if (!isVisible) {
        initializeConfigPanel();
    }
});

saveConfigBtn.addEventListener('click', () => {
    const selected = getSelectedEPIs();
    if (selected.length === 0) {
        configStatus.innerHTML = '<p style="color: #dc3545;">⚠️ Selecione pelo menos um EPI obrigatório!</p>';
        return;
    }
    
    saveRequiredEPIs(selected);
    configStatus.innerHTML = `<p style="color: #28a745;">✅ Configuração salva! ${selected.length} EPI(s) obrigatório(s) configurado(s).</p>`;
    
    // Fechar painel após salvar
    setTimeout(() => {
        configPanel.style.display = 'none';
        toggleConfigBtn.textContent = '⚙️ Configurar';
    }, 1500);
});

selectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.epi-checkbox').forEach(cb => cb.checked = true);
});

deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.epi-checkbox').forEach(cb => cb.checked = false);
});

// Inicializar painel de configuração ao carregar
document.addEventListener('DOMContentLoaded', () => {
    initializeConfigPanel();
    
    // Mostrar EPIs obrigatórios atuais
    if (EPIS_OBRIGATORIOS.length > 0) {
        updateStatus(`📋 EPIs obrigatórios configurados: ${EPIS_OBRIGATORIOS.join(', ')}`);
    }
});

// Inicializar câmera
startBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Câmera traseira no celular
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        video.play();
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        captureBtn.disabled = false;
        
        updateStatus('✅ Câmera ativada! Clique em "Capturar e Analisar" para detectar EPIs.');
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        updateStatus('❌ Erro ao acessar a câmera. Verifique as permissões.');
        alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
});

// Parar câmera
stopBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    captureBtn.disabled = true;
    
    updateStatus('⏳ Câmera desativada.');
    clearResults();
});

// Capturar e analisar
captureBtn.addEventListener('click', async () => {
    if (!stream || !video.videoWidth) {
        updateStatus('❌ Câmera não está pronta.');
        return;
    }
    
    if (isDetecting) {
        return; // Evitar múltiplas requisições simultâneas
    }
    
    isDetecting = true;
    captureBtn.disabled = true;
    updateStatus('🔍 Analisando imagem...');
    
    try {
        // Capturar frame do vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Converter para base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Enviar para API como base64
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });
            
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.statusText}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        updateStatus(`❌ Erro ao processar imagem: ${error.message}`);
    } finally {
        isDetecting = false;
        captureBtn.disabled = false;
    }
});

// Exibir resultados
function displayResults(data) {
    resultsBox.innerHTML = '';
    epiStatusBox.innerHTML = '';
    epiStatusBox.className = 'epi-status';
    
    if (!data.predictions || data.predictions.length === 0) {
        resultsBox.innerHTML = '<p>Nenhum EPI detectado nesta imagem.</p>';
        updateStatus('⚠️ Nenhum EPI foi detectado.');
        epiStatusBox.className = 'epi-status warning';
        epiStatusBox.innerHTML = `
            <h3>⚠️ Atenção!</h3>
            <p>Nenhum EPI foi detectado. Certifique-se de estar usando os equipamentos corretos.</p>
        `;
        return;
    }
    
    // Agrupar detecções por classe
    const detections = {};
    data.predictions.forEach(pred => {
        const classId = pred.class;
        const className = EPI_CLASSES[classId] || `Classe ${classId}`;
        
        if (!detections[className]) {
            detections[className] = {
                count: 0,
                maxConfidence: 0
            };
        }
        
        detections[className].count++;
        detections[className].maxConfidence = Math.max(
            detections[className].maxConfidence,
            pred.confidence
        );
    });
    
    // Exibir EPIs detectados
    const detectedEPIs = Object.keys(detections);
    detectedEPIs.forEach(epi => {
        const detection = detections[epi];
        const confidence = (detection.maxConfidence * 100).toFixed(1);
        
        const epiItem = document.createElement('div');
        epiItem.className = 'epi-item detected';
        epiItem.innerHTML = `
            <h3>✅ ${epi.toUpperCase()}</h3>
            <p class="confidence">Confiança: ${confidence}% | Detecções: ${detection.count}</p>
        `;
        resultsBox.appendChild(epiItem);
    });
    
    // Verificar EPIs obrigatórios
    const missingEPIs = EPIS_OBRIGATORIOS.filter(epi => !detectedEPIs.includes(epi));
    
    if (missingEPIs.length === 0) {
        updateStatus('✅ Todos os EPIs obrigatórios foram detectados!');
        epiStatusBox.className = 'epi-status success';
        epiStatusBox.innerHTML = `
            <h3>✅ Conformidade Total</h3>
            <p>Todos os EPIs obrigatórios foram detectados corretamente.</p>
        `;
    } else {
        updateStatus(`⚠️ Faltando ${missingEPIs.length} EPI(s) obrigatório(s).`);
        epiStatusBox.className = 'epi-status warning';
        epiStatusBox.innerHTML = `
            <h3>⚠️ EPIs Faltando</h3>
            <ul>
                ${missingEPIs.map(epi => `<li>❌ ${epi.toUpperCase()}</li>`).join('')}
            </ul>
            <p>Por favor, utilize todos os equipamentos obrigatórios.</p>
        `;
    }
}

// Atualizar status
function updateStatus(message) {
    statusBox.innerHTML = `<p>${message}</p>`;
}

// Limpar resultados
function clearResults() {
    resultsBox.innerHTML = '';
    epiStatusBox.innerHTML = '';
    epiStatusBox.className = 'epi-status';
}
