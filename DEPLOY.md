# 🚀 Guia de Deploy no Vercel

## Passo a Passo Completo

### 1. Preparar o Projeto

Certifique-se de que todos os arquivos estão na pasta `epi-detection-app`.

### 2. Obter Credenciais do Roboflow

1. Acesse seu projeto no Roboflow
2. Vá em **Deploy** > **Roboflow API**
3. Copie as seguintes informações:
   - **API Key** (ex: `xxxxxxxxxxxxxxxx`)
   - **Model ID** (ex: `epi-detection/1`)
   - **Workspace** (ex: `seu-workspace`)

### 3. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 4. Fazer Login no Vercel

```bash
vercel login
```

### 5. Deploy Inicial

No diretório `epi-detection-app`:

```bash
cd epi-detection-app
vercel
```

Siga as instruções:
- Set up and deploy? **Y**
- Which scope? Escolha sua conta
- Link to existing project? **N** (primeira vez)
- What's your project's name? **epi-detection-app** (ou outro nome)
- In which directory is your code located? **./**

### 6. Configurar Variáveis de Ambiente

Após o deploy inicial, configure as variáveis:

**Opção A: Via CLI**
```bash
vercel env add ROBOFLOW_API_KEY
vercel env add ROBOFLOW_MODEL_ID
vercel env add ROBOFLOW_WORKSPACE
```

Quando solicitado, escolha:
- Environment: **Production, Preview, Development** (todos)

**Opção B: Via Painel Web**

1. Acesse [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - `ROBOFLOW_API_KEY` = sua API key
   - `ROBOFLOW_MODEL_ID` = seu model ID
   - `ROBOFLOW_WORKSPACE` = seu workspace

### 7. Redeploy com Variáveis

```bash
vercel --prod
```

### 8. Acessar o App

Após o deploy, você receberá uma URL como:
```
https://epi-detection-app.vercel.app
```

## ✅ Verificação

1. Acesse a URL do seu app
2. Clique em "Iniciar Câmera"
3. Permita acesso à câmera
4. Clique em "Capturar e Analisar"
5. Verifique se os resultados aparecem

## 🔧 Troubleshooting

### Erro 500 - Configuração não encontrada
- Verifique se as variáveis de ambiente foram adicionadas
- Certifique-se de fazer redeploy após adicionar variáveis

### Erro ao acessar câmera
- Verifique se está usando HTTPS (Vercel já fornece)
- Teste em dispositivo móvel
- Verifique permissões do navegador

### Detecções não aparecem
- Verifique se o modelo está público no Roboflow
- Confirme os IDs das classes em `app.js`
- Veja os logs no console (F12)

## 📱 Teste no Celular

1. Abra o navegador no celular
2. Acesse a URL do Vercel
3. Permita acesso à câmera quando solicitado
4. Use a aplicação normalmente

## 🔄 Atualizações Futuras

Para fazer atualizações:

```bash
# Fazer alterações nos arquivos
# Depois:
vercel --prod
```

Ou configure Git para deploy automático no Vercel.


