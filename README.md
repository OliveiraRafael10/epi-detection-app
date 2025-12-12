# App Web - Detecção de EPIs

Aplicação web para detecção de Equipamentos de Proteção Individual (EPIs) em tempo real usando câmera do dispositivo e modelo YOLOv11 treinado no Roboflow.

## Sobre o Projeto

Este projeto permite verificar o uso correto de EPIs através de análise de imagens capturadas pela câmera. O sistema detecta equipamentos como capacete, óculos, máscara facial, luvas e colete de segurança, verificando se os EPIs obrigatórios configurados estão presentes.

## Funcionalidades

- Acesso à câmera via navegador
- Detecção de EPIs em tempo real
- Verificação de conformidade com EPIs obrigatórios
- Modo de detecção contínua (análise automática)
- Visualização de bounding boxes sobre os objetos detectados
- Histórico de detecções com estatísticas
- Modo de teste com dados simulados
- Interface responsiva para dispositivos móveis

## Pré-requisitos

- Node.js instalado
- Conta no Roboflow com modelo treinado
- Navegador moderno com suporte a câmera (HTTPS necessário)

## Instalação Local

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

3. Para desenvolvimento local com Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

Ou use um servidor HTTP simples:
```bash
python -m http.server 8000
```

## Deploy no Vercel

1. Instale o Vercel CLI:
```bash
npm install -g vercel
```

2. Faça login e faça o deploy:
```bash
vercel login
vercel
```

3. Configure as variáveis de ambiente no painel do Vercel:
   - Settings > Environment Variables
   - Adicione: ROBOFLOW_API_KEY, ROBOFLOW_MODEL_ID, ROBOFLOW_WORKSPACE

4. Obtenha as credenciais no Roboflow:
   - Acesse Deploy > Roboflow API
   - Copie API Key, Model ID e Workspace

5. Faça o deploy em produção:
```bash
vercel --prod
```

## Configuração das Classes

No arquivo `app.js`, ajuste os IDs das classes conforme seu modelo treinado:

```javascript
const EPI_CLASSES = {
    0: 'pessoa',
    10: 'capacete',
    8: 'óculos',
    5: 'máscara facial',
    9: 'luvas',
    16: 'colete de segurança'
};
```

Verifique os IDs corretos no Roboflow em Annotate > Classes.

## Estrutura do Projeto

```
epi-detection-app/
├── index.html          # Interface principal
├── styles.css          # Estilos CSS
├── app.js              # Lógica do frontend
├── api/
│   └── detect.js       # API endpoint (Vercel Serverless)
├── package.json        # Dependências
├── vercel.json         # Configuração Vercel
└── README.md           # Documentação
```

## Uso

1. Acesse a aplicação no navegador
2. Permita o acesso à câmera quando solicitado
3. Clique em "Iniciar Câmera"
4. Use "Capturar e Analisar" para análise manual ou "Detecção Contínua" para monitoramento automático
5. Configure os EPIs obrigatórios no painel de configuração
6. Visualize os resultados com bounding boxes sobre os objetos detectados

## Solução de Problemas

**Câmera não acessível:**
- Verifique as permissões do navegador
- Certifique-se de usar HTTPS (Vercel fornece automaticamente)

**API Key não encontrada:**
- Verifique se as variáveis de ambiente estão configuradas no Vercel
- Faça redeploy após adicionar as variáveis

**Detecções não aparecem:**
- Verifique se os IDs das classes em app.js estão corretos
- Confirme que o modelo está acessível no Roboflow
- Verifique os logs do console do navegador (F12)

## Notas Técnicas

- O app requer HTTPS para acesso à câmera (fornecido automaticamente pelo Vercel)
- A câmera traseira é priorizada em dispositivos móveis
- O modelo roda na API do Roboflow, não localmente
- As imagens são comprimidas antes do envio para otimizar performance
- O histórico de detecções é armazenado no localStorage do navegador

## Licença

MIT
