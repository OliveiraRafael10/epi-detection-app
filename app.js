// Configuração da API
// Para produção no Vercel, a URL será automaticamente /api/detect
// Para desenvolvimento local com Vercel CLI, descomente a linha abaixo e comente a linha de produção
// const API_URL = 'http://localhost:3000/api/detect';
const API_URL = '/api/detect';

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
let autoDetectInterval = null;
let detectionHistory = loadDetectionHistory();
let stats = loadStats();

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
        configStatus.innerHTML = '<p style="color: #dc3545;">Selecione pelo menos um EPI obrigatório!</p>';
        return;
    }
    
    saveRequiredEPIs(selected);
    configStatus.innerHTML = `<p style="color: #28a745;">Configuração salva! ${selected.length} EPI(s) obrigatório(s) configurado(s).</p>`;
    
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

// ========== FUNÇÕES DE NOTIFICAÇÃO ==========
function playNotificationSound(type) {
    // Criar contexto de áudio para notificações
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'warning') {
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// ========== FUNÇÕES DE ESTATÍSTICAS NA UI ==========
function updateStatsDisplay() {
    const statsDisplay = document.getElementById('statsDisplay');
    if (!statsDisplay) return;
    
    const complianceRate = stats.totalDetections > 0 
        ? ((stats.compliantDetections / stats.totalDetections) * 100).toFixed(1)
        : 0;
    
    statsDisplay.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total de Análises:</span>
            <span class="stat-value">${stats.totalDetections}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Conformes:</span>
            <span class="stat-value success">${stats.compliantDetections}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Não Conformes:</span>
            <span class="stat-value warning">${stats.nonCompliantDetections}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Taxa de Conformidade:</span>
            <span class="stat-value">${complianceRate}%</span>
        </div>
    `;
}

// ========== FUNÇÕES DE HISTÓRICO NA UI ==========
function updateHistoryDisplay() {
    const historyDisplay = document.getElementById('historyDisplay');
    if (!historyDisplay) return;
    
    if (detectionHistory.length === 0) {
        historyDisplay.innerHTML = '<p class="empty-history">Nenhuma detecção registrada ainda.</p>';
        return;
    }
    
    // Mostrar últimos 10 registros
    const recentHistory = detectionHistory.slice(-10).reverse();
    
    historyDisplay.innerHTML = recentHistory.map(entry => {
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleTimeString('pt-BR');
        const dateStr = date.toLocaleDateString('pt-BR');
        
        return `
            <div class="history-item ${entry.isCompliant ? 'compliant' : 'non-compliant'}">
                <div class="history-time">${dateStr} ${timeStr}</div>
                <div class="history-status">
                    ${entry.isCompliant ? 'Conforme' : 'Não Conforme'}
                </div>
                <div class="history-details">
                    Detectados: ${entry.detectedEPIs.length} | 
                    Faltando: ${entry.missingEPIs.length}
                </div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        detectionHistory = [];
        saveDetectionHistory();
        updateHistoryDisplay();
    }
}

// ========== EVENT LISTENERS ADICIONAIS ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeConfigPanel();
    
    // Mostrar EPIs obrigatórios atuais
    if (EPIS_OBRIGATORIOS.length > 0) {
        updateStatus(`EPIs obrigatórios configurados: ${EPIS_OBRIGATORIOS.join(', ')}`);
    }
    
    // Inicializar overlay do vídeo
    initializeVideoOverlay();
    
    // Atualizar estatísticas e histórico
    updateStatsDisplay();
    updateHistoryDisplay();
    
    // Botão de detecção contínua
    const autoDetectBtn = document.getElementById('autoDetectBtn');
    if (autoDetectBtn) {
        let isAutoDetecting = false;
        autoDetectBtn.addEventListener('click', () => {
            if (!isAutoDetecting) {
                startAutoDetect(3); // A cada 3 segundos
                autoDetectBtn.textContent = 'Parar Detecção';
                autoDetectBtn.classList.add('active');
                isAutoDetecting = true;
                updateStatus('Modo de detecção contínua ativado (a cada 3 segundos)');
            } else {
                stopAutoDetect();
                autoDetectBtn.textContent = 'Detecção Contínua';
                autoDetectBtn.classList.remove('active');
                isAutoDetecting = false;
                updateStatus('Detecção contínua desativada');
            }
        });
    }
    
    // Botão de modo teste
    const testModeBtn = document.getElementById('testModeBtn');
    if (testModeBtn) {
        testModeBtn.addEventListener('click', () => {
            captureAndAnalyze(true); // Usar mock data
        });
    }
    
    // Botão de limpar histórico
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
});

// Inicializar overlay do vídeo
function initializeVideoOverlay() {
    const overlay = document.getElementById('videoOverlay');
    if (!overlay) return;
    
    // Sincronizar tamanho do overlay com o vídeo quando carregar
    const syncOverlay = () => {
        if (video.videoWidth && video.videoHeight) {
            overlay.width = video.videoWidth;
            overlay.height = video.videoHeight;
        }
    };
    
    video.addEventListener('loadedmetadata', syncOverlay);
    video.addEventListener('resize', syncOverlay);
}

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
        
        // Configurar overlay após o vídeo carregar
        video.addEventListener('loadedmetadata', () => {
            const overlay = document.getElementById('videoOverlay');
            if (overlay && video.videoWidth && video.videoHeight) {
                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;
            }
        });
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        captureBtn.disabled = false;
        
        // Habilitar botão de detecção contínua
        const autoDetectBtn = document.getElementById('autoDetectBtn');
        if (autoDetectBtn) autoDetectBtn.disabled = false;
        
        updateStatus('Câmera ativada! Clique em "Capturar e Analisar" para detectar EPIs.');
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        updateStatus('Erro ao acessar a câmera. Verifique as permissões.');
        alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
});

// Parar câmera
stopBtn.addEventListener('click', () => {
    stopAutoDetect();
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    captureBtn.disabled = true;
    
    updateStatus('Câmera desativada.');
    clearResults();
});

// Capturar e analisar (botão manual)
captureBtn.addEventListener('click', () => {
    captureAndAnalyze(false);
});

// Exibir resultados
function displayResults(data) {
    resultsBox.innerHTML = '';
    epiStatusBox.innerHTML = '';
    epiStatusBox.className = 'epi-status';
    
    // Atualizar overlay do vídeo com bounding boxes
    if (data.predictions && data.predictions.length > 0) {
        drawBoundingBoxes(data.predictions, video);
    } else {
        clearVideoOverlay();
    }
    
    if (!data.predictions || data.predictions.length === 0) {
        resultsBox.innerHTML = '<p>Nenhum EPI detectado nesta imagem.</p>';
        updateStatus('Nenhum EPI foi detectado.');
        epiStatusBox.className = 'epi-status warning';
        epiStatusBox.innerHTML = `
            <h3>Atenção</h3>
            <p>Nenhum EPI foi detectado. Certifique-se de estar usando os equipamentos corretos.</p>
        `;
        
        // Adicionar ao histórico
        addToHistory(data, [], EPIS_OBRIGATORIOS);
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
                maxConfidence: 0,
                predictions: []
            };
        }
        
        detections[className].count++;
        detections[className].maxConfidence = Math.max(
            detections[className].maxConfidence,
            pred.confidence
        );
        detections[className].predictions.push(pred);
    });
    
    // Exibir EPIs detectados
    const detectedEPIs = Object.keys(detections);
    detectedEPIs.forEach(epi => {
        const detection = detections[epi];
        const confidence = (detection.maxConfidence * 100).toFixed(1);
        const isRequired = EPIS_OBRIGATORIOS.includes(epi);
        
        const epiItem = document.createElement('div');
        epiItem.className = `epi-item detected ${isRequired ? 'required' : ''}`;
        epiItem.innerHTML = `
            <h3>${epi.toUpperCase()} ${isRequired ? '<span class="required-badge">OBRIGATÓRIO</span>' : ''}</h3>
            <p class="confidence">Confiança: ${confidence}% | Detecções: ${detection.count}</p>
        `;
        resultsBox.appendChild(epiItem);
    });
    
    // Verificar EPIs obrigatórios
    const missingEPIs = EPIS_OBRIGATORIOS.filter(epi => !detectedEPIs.includes(epi));
    
    if (missingEPIs.length === 0) {
        updateStatus('Todos os EPIs obrigatórios foram detectados!');
        epiStatusBox.className = 'epi-status success';
        epiStatusBox.innerHTML = `
            <h3>Conformidade Total</h3>
            <p>Todos os EPIs obrigatórios foram detectados corretamente.</p>
            <p class="stats-info">Total de detecções: ${data.predictions.length}</p>
        `;
        
        // Notificação visual/sonora de sucesso
        playNotificationSound('success');
    } else {
        updateStatus(`Faltando ${missingEPIs.length} EPI(s) obrigatório(s).`);
        epiStatusBox.className = 'epi-status warning';
        epiStatusBox.innerHTML = `
            <h3>EPIs Faltando</h3>
            <ul>
                ${missingEPIs.map(epi => `<li>${epi.toUpperCase()}</li>`).join('')}
            </ul>
            <p>Por favor, utilize todos os equipamentos obrigatórios.</p>
            <p class="stats-info">Total de detecções: ${data.predictions.length}</p>
        `;
        
        // Notificação visual/sonora de alerta
        playNotificationSound('warning');
    }
    
    // Adicionar ao histórico
    addToHistory(data, detectedEPIs, missingEPIs);
    
    // Atualizar estatísticas e histórico na UI
    updateStatsDisplay();
    updateHistoryDisplay();
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
    // Limpar bounding boxes do vídeo
    clearVideoOverlay();
}

// ========== FUNÇÕES DE HISTÓRICO ==========
function loadDetectionHistory() {
    const saved = localStorage.getItem('detectionHistory');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
        }
    }
    return [];
}

function saveDetectionHistory() {
    // Manter apenas os últimos 50 registros
    if (detectionHistory.length > 50) {
        detectionHistory = detectionHistory.slice(-50);
    }
    localStorage.setItem('detectionHistory', JSON.stringify(detectionHistory));
}

function addToHistory(data, detectedEPIs, missingEPIs) {
    const historyEntry = {
        timestamp: new Date().toISOString(),
        detectedEPIs: detectedEPIs,
        missingEPIs: missingEPIs,
        totalDetections: data.predictions?.length || 0,
        isCompliant: missingEPIs.length === 0
    };
    
    detectionHistory.push(historyEntry);
    saveDetectionHistory();
    updateStats(historyEntry);
}

// ========== FUNÇÕES DE ESTATÍSTICAS ==========
function loadStats() {
    const saved = localStorage.getItem('detectionStats');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao carregar estatísticas:', e);
        }
    }
    return {
        totalDetections: 0,
        compliantDetections: 0,
        nonCompliantDetections: 0,
        epiCounts: {}
    };
}

function saveStats() {
    localStorage.setItem('detectionStats', JSON.stringify(stats));
}

function updateStats(entry) {
    stats.totalDetections++;
    if (entry.isCompliant) {
        stats.compliantDetections++;
    } else {
        stats.nonCompliantDetections++;
    }
    
    entry.detectedEPIs.forEach(epi => {
        stats.epiCounts[epi] = (stats.epiCounts[epi] || 0) + 1;
    });
    
    saveStats();
}

// ========== FUNÇÕES DE BOUNDING BOXES ==========
function drawBoundingBoxes(predictions, videoElement) {
    clearVideoOverlay();
    
    if (!predictions || predictions.length === 0) return;
    
    const overlay = document.getElementById('videoOverlay');
    if (!overlay) return;
    
    // Sincronizar tamanho do overlay com o vídeo
    if (overlay.width !== videoElement.videoWidth || overlay.height !== videoElement.videoHeight) {
        overlay.width = videoElement.videoWidth;
        overlay.height = videoElement.videoHeight;
    }
    
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    predictions.forEach(pred => {
        const className = EPI_CLASSES[pred.class] || `Classe ${pred.class}`;
        const confidence = pred.confidence;
        
        // Coordenadas já estão no formato correto (centro x, y, largura, altura)
        const x = pred.x;
        const y = pred.y;
        const width = pred.width;
        const height = pred.height;
        
        // Cores baseadas no tipo de EPI
        const isRequired = EPIS_OBRIGATORIOS.includes(className);
        const color = isRequired ? '#28a745' : '#667eea';
        
        // Desenhar retângulo
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Desenhar label com fundo
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Arial';
        const label = `${className} ${(confidence * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(label).width;
        const labelHeight = 20;
        const labelY = Math.max(labelHeight, y - height/2 - 5);
        
        ctx.fillRect(x - width/2, labelY - labelHeight, textWidth + 10, labelHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(label, x - width/2 + 5, labelY - 5);
    });
}

function clearVideoOverlay() {
    const overlay = document.getElementById('videoOverlay');
    if (overlay) {
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
}

// ========== FUNÇÕES DE DETECÇÃO CONTÍNUA ==========
function startAutoDetect(intervalSeconds = 3) {
    if (autoDetectInterval) {
        clearInterval(autoDetectInterval);
    }
    
    autoDetectInterval = setInterval(() => {
        if (stream && video.videoWidth && !isDetecting) {
            captureAndAnalyze();
        }
    }, intervalSeconds * 1000);
}

function stopAutoDetect() {
    if (autoDetectInterval) {
        clearInterval(autoDetectInterval);
        autoDetectInterval = null;
    }
}

// ========== FUNÇÕES DE COMPRESSÃO ==========
function compressImage(imageData, maxWidth = 1280, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Redimensionar se necessário
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.src = imageData;
    });
}

// ========== FUNÇÕES DE MOCK DATA (TESTE) ==========
function generateMockData() {
    const mockPredictions = [];
    const availableEPIs = Object.values(EPIS_DISPONIVEIS);
    
    // Simular algumas detecções aleatórias
    const numDetections = Math.floor(Math.random() * 5) + 1;
    const selectedEPIs = availableEPIs
        .sort(() => 0.5 - Math.random())
        .slice(0, numDetections);
    
    selectedEPIs.forEach((epiName, index) => {
        const classId = Object.keys(EPIS_DISPONIVEIS).find(
            key => EPIS_DISPONIVEIS[key] === epiName
        );
        
        mockPredictions.push({
            class: parseInt(classId),
            confidence: 0.7 + Math.random() * 0.25,
            x: 200 + (index * 150),
            y: 200 + (index * 100),
            width: 100 + Math.random() * 50,
            height: 100 + Math.random() * 50
        });
    });
    
    return {
        success: true,
        predictions: mockPredictions,
        image: { width: 640, height: 480 },
        time: 0.5
    };
}

// ========== FUNÇÃO PRINCIPAL DE CAPTURA ==========
async function captureAndAnalyze(useMock = false) {
    if (!stream || !video.videoWidth) {
        updateStatus('Câmera não está pronta.');
        return;
    }
    
    if (isDetecting) {
        return;
    }
    
    isDetecting = true;
    captureBtn.disabled = true;
    updateStatus('Analisando imagem...');
    
    try {
        let data;
        
        if (useMock) {
            // Usar dados mock para teste
            await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
            data = generateMockData();
        } else {
            // Capturar frame do vídeo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            // Converter e comprimir
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            const compressedImage = await compressImage(imageData);
            
            // Enviar para API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: compressedImage })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            
            data = await response.json();
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        updateStatus(`Erro ao processar imagem: ${error.message}`);
        
        // Em caso de erro, oferecer modo de teste
        if (!useMock && error.message.includes('API')) {
            const useTest = confirm('Erro ao conectar com a API. Deseja usar o modo de teste com dados simulados?');
            if (useTest) {
                captureAndAnalyze(true);
                return;
            }
        }
    } finally {
        isDetecting = false;
        captureBtn.disabled = false;
    }
}
