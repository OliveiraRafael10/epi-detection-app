# 🛡️ App Web - Detecção de EPIs

Aplicação web para detecção de Equipamentos de Proteção Individual (EPIs) em tempo real usando câmera do celular e modelo YOLOv8 treinado no Roboflow.

## 📋 Funcionalidades

- ✅ Acesso à câmera do celular via navegador
- ✅ Detecção de EPIs em tempo real
- ✅ Verificação de conformidade (EPIs obrigatórios)
- ✅ Interface responsiva e moderna
- ✅ Deploy fácil no Vercel

## 🚀 Como Usar Localmente

### Pré-requisitos

- Node.js instalado
- Conta no Roboflow com modelo treinado

### Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```
ROBOFLOW_API_KEY=sua_api_key_aqui
ROBOFLOW_MODEL_ID=seu_model_id_aqui
ROBOFLOW_WORKSPACE=seu_workspace_aqui
```

3. Para desenvolvimento local, você pode usar o Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

Ou use um servidor simples:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

## 🌐 Deploy no Vercel

### Passo 1: Preparar o Projeto

1. Certifique-se de que todos os arquivos estão na pasta `epi-detection-app`
2. Verifique se o `package.json` está configurado corretamente

### Passo 2: Conectar ao Vercel

1. Instale o Vercel CLI (se ainda não tiver):
```bash
npm install -g vercel
```

2. Faça login no Vercel:
```bash
vercel login
```

3. No diretório do projeto, execute:
```bash
vercel
```

4. Siga as instruções no terminal

### Passo 3: Configurar Variáveis de Ambiente

No painel do Vercel:

1. Vá em **Settings** > **Environment Variables**
2. Adicione as seguintes variáveis:
   - `ROBOFLOW_API_KEY` - Sua API key do Roboflow
   - `ROBOFLOW_MODEL_ID` - ID do seu modelo treinado
   - `ROBOFLOW_WORKSPACE` - Nome do seu workspace no Roboflow

### Passo 4: Obter Credenciais do Roboflow

1. Acesse seu projeto no Roboflow
2. Vá em **Deploy** > **Roboflow API**
3. Copie:
   - **API Key** → `ROBOFLOW_API_KEY`
   - **Model ID** → `ROBOFLOW_MODEL_ID`
   - **Workspace** → `ROBOFLOW_WORKSPACE`

### Passo 5: Deploy

```bash
vercel --prod
```

Ou faça push para o Git conectado ao Vercel (deploy automático).

## 📱 Como Usar no Celular

1. Abra o navegador no seu celular
2. Acesse a URL do seu app no Vercel
3. Permita o acesso à câmera quando solicitado
4. Clique em "Iniciar Câmera"
5. Posicione-se na frente da câmera
6. Clique em "Capturar e Analisar"
7. Veja os resultados da detecção

## 🔧 Configuração dos IDs das Classes

No arquivo `app.js`, ajuste os IDs das classes conforme seu modelo:

```javascript
const EPI_CLASSES = {
    0: 'capacete',
    1: 'colete_refletivo',
    2: 'luvas',
    3: 'mascara',
    4: 'oculos'
};
```

Verifique os IDs corretos no Roboflow:
1. Vá em **Annotate** > **Classes**
2. Veja a ordem/número de cada classe
3. Ajuste o objeto `EPI_CLASSES` conforme necessário

## 📂 Estrutura do Projeto

```
epi-detection-app/
├── index.html          # Interface principal
├── styles.css          # Estilos CSS
├── app.js              # Lógica do frontend
├── api/
│   ├── detect.js       # API endpoint (alternativa)
│   └── detect-vercel.js # API endpoint (Vercel)
├── package.json        # Dependências
├── vercel.json         # Configuração Vercel
└── README.md           # Este arquivo
```

## 🐛 Troubleshooting

### Erro: "Câmera não acessível"
- Verifique as permissões do navegador
- Certifique-se de usar HTTPS (Vercel já fornece)

### Erro: "API Key não encontrada"
- Verifique se as variáveis de ambiente estão configuradas no Vercel
- Certifique-se de que fez o redeploy após adicionar as variáveis

### Detecções não aparecem
- Verifique se os IDs das classes em `app.js` estão corretos
- Confirme que o modelo está publicamente acessível no Roboflow
- Verifique os logs do console do navegador (F12)

## 📝 Notas

- O app usa HTTPS automaticamente no Vercel (necessário para acesso à câmera)
- A câmera traseira é priorizada em dispositivos móveis
- O modelo roda na API do Roboflow, não localmente
- Para melhor performance, considere otimizar as imagens antes de enviar

## 📄 Licença

MIT
