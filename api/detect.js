// API endpoint para Vercel Serverless Functions
// Processa imagens e envia para a API do Roboflow

const FormData = require('form-data');
const fetch = require('node-fetch');

// Helper para processar FormData no Vercel
async function parseFormData(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        req.on('error', reject);
    });
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const ROBOTFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
        const ROBOTFLOW_MODEL_ID = process.env.ROBOFLOW_MODEL_ID;
        const ROBOTFLOW_WORKSPACE = process.env.ROBOFLOW_WORKSPACE;

        if (!ROBOTFLOW_API_KEY || !ROBOTFLOW_MODEL_ID || !ROBOTFLOW_WORKSPACE) {
            return res.status(500).json({ 
                error: 'Configuração do Roboflow não encontrada',
                message: 'Configure as variáveis de ambiente no Vercel'
            });
        }

        // Processar imagem do FormData
        let imageBuffer;
        
        // Tentar ler do body (Vercel já processa)
        if (req.body) {
            // Se for base64
            if (typeof req.body === 'string' || req.body.image) {
                const imageData = typeof req.body === 'string' ? req.body : req.body.image;
                const base64Data = imageData.includes(',') 
                    ? imageData.split(',')[1] 
                    : imageData;
                imageBuffer = Buffer.from(base64Data, 'base64');
            } 
            // Se for buffer direto
            else if (Buffer.isBuffer(req.body)) {
                imageBuffer = req.body;
            }
        }

        // Se não conseguiu processar, tentar ler do stream
        if (!imageBuffer) {
            imageBuffer = await parseFormData(req);
        }

        if (!imageBuffer || imageBuffer.length === 0) {
            return res.status(400).json({ error: 'Imagem não fornecida ou inválida' });
        }

        // Criar FormData para enviar ao Roboflow
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        // URL da API do Roboflow
        // Formato: https://detect.roboflow.com/{workspace}/{model_id}?api_key={api_key}
        const roboflowUrl = `https://detect.roboflow.com/${ROBOTFLOW_WORKSPACE}/${ROBOTFLOW_MODEL_ID}?api_key=${ROBOTFLOW_API_KEY}`;

        // Enviar para Roboflow
        const response = await fetch(roboflowUrl, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na API do Roboflow:', errorText);
            return res.status(response.status).json({ 
                error: 'Erro ao processar imagem',
                details: errorText
            });
        }

        const data = await response.json();

        // Retornar resultado formatado
        return res.status(200).json({
            success: true,
            predictions: data.predictions || [],
            image: {
                width: data.image?.width || 0,
                height: data.image?.height || 0
            },
            time: data.time || 0
        });

    } catch (error) {
        console.error('Erro no endpoint:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
};