# Documentação Técnica para Implementação do Aplicativo MundoemCores.com

## Visão Geral do Projeto

O aplicativo MundoemCores.com é uma plataforma educacional para pais que oferece cursos, playlists e e-books sobre desenvolvimento infantil, educação positiva e outros temas relacionados. O aplicativo também inclui uma assistente virtual chamada Cora, que pode ser acessada tanto pelo aplicativo quanto pelo WhatsApp.

## Arquitetura do Sistema

### Frontend
- **Framework**: React Native
- **Linguagem**: JavaScript/TypeScript
- **Plataformas**: iOS e Android

### Backend
- **Serviços**: Firebase (Autenticação, Firestore, Storage)
- **Funções Serverless**: Firebase Cloud Functions
- **Banco de Dados**: Firestore (NoSQL)

### Integrações Externas
- **Vimeo API**: Para streaming de vídeos
- **WhatsApp Business API**: Para integração da assistente Cora com WhatsApp
- **OpenAI API**: Para funcionalidades da assistente virtual Cora

## Requisitos Técnicos

### Ambiente de Desenvolvimento
- Node.js (versão 16+)
- React Native CLI ou Expo
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS)
- Firebase CLI
- Git

### Dependências Principais
- React Native (versão 0.70+)
- React Navigation (para navegação entre telas)
- Firebase SDK
- Vimeo SDK para React Native
- OpenAI Node.js SDK
- Axios (para requisições HTTP)
- React Native WebView (para player de vídeo)

## Estrutura do Projeto

```
mundoemcores/
├── src/
│   ├── assets/           # Imagens, fontes e outros recursos estáticos
│   ├── components/       # Componentes reutilizáveis
│   │   ├── CourseCard.js
│   │   ├── VimeoPlayer.js
│   │   ├── CoraAssistant.js
│   │   └── ...
│   ├── screens/          # Telas do aplicativo
│   │   ├── HomeScreen.js
│   │   ├── CoursesScreen.js
│   │   ├── CourseDetailScreen.js
│   │   ├── VideoPlayerScreen.js
│   │   └── ...
│   ├── services/         # Serviços e integrações
│   │   ├── vimeoService.js
│   │   ├── cora/
│   │   │   ├── coraService.js
│   │   │   └── coraKnowledgeManager.js
│   │   └── whatsapp/
│   │       ├── whatsappService.js
│   │       └── coraWhatsAppIntegration.js
│   ├── navigation/       # Configuração de navegação
│   ├── context/          # Contextos React (autenticação, tema, etc.)
│   ├── hooks/            # Hooks personalizados
│   ├── utils/            # Funções utilitárias
│   └── App.js            # Componente principal
├── firebase/
│   ├── functions/        # Funções Cloud Functions
│   └── firestore.rules   # Regras de segurança do Firestore
├── ios/                  # Código nativo iOS
├── android/              # Código nativo Android
└── ...
```

## Detalhes de Implementação

### 1. Autenticação e Gerenciamento de Usuários

Implementar autenticação usando Firebase Authentication:
- Login/registro com email e senha
- Login social (Google, Apple, Facebook)
- Recuperação de senha
- Perfis de usuário com níveis de acesso (gratuito/premium)

```javascript
// Exemplo de implementação de autenticação
import auth from '@react-native-firebase/auth';

// Registro de usuário
const registerUser = async (email, password) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
};

// Login de usuário
const loginUser = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};
```

### 2. Integração com Vimeo

Implementar a integração com a API do Vimeo para streaming de vídeos:
- Autenticação com a API do Vimeo
- Busca e listagem de vídeos
- Reprodução de vídeos protegidos
- Controle de progresso de visualização

```javascript
// Exemplo de integração com Vimeo
import axios from 'axios';

const VIMEO_ACCESS_TOKEN = 'SEU_TOKEN_DE_ACESSO';

const vimeoApi = axios.create({
  baseURL: 'https://api.vimeo.com',
  headers: {
    'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.vimeo.*+json;version=3.4'
  }
});

// Buscar vídeo por ID
const getVideoById = async (videoId) => {
  try {
    const response = await vimeoApi.get(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    throw error;
  }
};

// Obter URL de reprodução
const getPlaybackUrl = async (videoId) => {
  try {
    const video = await getVideoById(videoId);
    return video.files.find(file => file.quality === 'hd').link;
  } catch (error) {
    console.error('Erro ao obter URL de reprodução:', error);
    throw error;
  }
};
```

### 3. Assistente Virtual Cora

Implementar a assistente virtual Cora usando a API da OpenAI:
- Integração com a API da OpenAI
- Sistema de gerenciamento de conversas
- Base de conhecimento personalizada
- Interface de chat no aplicativo

```javascript
// Exemplo de integração com OpenAI
import { OpenAIApi, Configuration } from 'openai';

const OPENAI_API_KEY = 'SUA_CHAVE_API_OPENAI';

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Gerar resposta da Cora
const generateCoraResponse = async (prompt, conversationHistory) => {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Você é Cora, uma assistente virtual especializada em desenvolvimento infantil e educação de filhos." },
        ...conversationHistory,
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw error;
  }
};
```

### 4. Integração com WhatsApp

Implementar a integração da Cora com o WhatsApp Business API:
- Configuração do WhatsApp Business API
- Webhook para receber mensagens
- Processamento de mensagens e envio de respostas
- Notificações e mensagens proativas

```javascript
// Exemplo de função Cloud Function para webhook do WhatsApp
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { body } = req;
    
    // Verificar se é uma mensagem válida
    if (body.object === 'whatsapp_business_account' && 
        body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0].value.messages) {
      
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const text = message.text.body;
      
      // Processar a mensagem com a Cora
      const coraResponse = await processMessageWithCora(text, from);
      
      // Enviar resposta via WhatsApp API
      await sendWhatsAppMessage(from, coraResponse);
      
      res.status(200).send('OK');
    } else {
      res.status(400).send('Invalid webhook data');
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Função para enviar mensagem via WhatsApp API
const sendWhatsAppMessage = async (to, text) => {
  // Implementação usando a API do WhatsApp Business
};
```

### 5. Modelo Freemium

Implementar o modelo freemium com acesso controlado ao conteúdo:
- Marcação de conteúdo como gratuito ou premium
- Verificação de assinatura antes de permitir acesso
- Acesso à primeira aula de cada curso para usuários gratuitos
- Integração com sistema de pagamento (Hotmart)

```javascript
// Exemplo de verificação de acesso a conteúdo
import firestore from '@react-native-firebase/firestore';

const checkContentAccess = async (userId, courseId, lessonId) => {
  try {
    // Verificar se o usuário tem assinatura ativa
    const userDoc = await firestore().collection('users').doc(userId).get();
    const hasActiveSubscription = userDoc.data().hasActiveSubscription;
    
    // Verificar se a lição é gratuita
    const lessonDoc = await firestore()
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(lessonId)
      .get();
    
    const isFreeLesson = lessonDoc.data().isFree;
    
    // Verificar se é a primeira lição do curso
    const isFirstLesson = lessonDoc.data().order === 1;
    
    // Permitir acesso se o usuário tem assinatura OU se a lição é gratuita OU se é a primeira lição
    return hasActiveSubscription || isFreeLesson || isFirstLesson;
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    return false;
  }
};
```

## Configuração de APIs e Serviços

### Firebase

1. Criar um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Adicionar aplicativos iOS e Android
3. Configurar autenticação, Firestore e Storage
4. Configurar regras de segurança

### Vimeo

1. Criar uma conta de desenvolvedor no [Vimeo Developer](https://developer.vimeo.com/)
2. Criar um aplicativo e obter credenciais de API
3. Configurar permissões e escopos necessários

### OpenAI

1. Criar uma conta na [OpenAI](https://platform.openai.com/)
2. Gerar uma chave de API
3. Configurar limites de uso e orçamento

### WhatsApp Business API

1. Criar uma conta no [Facebook Business Manager](https://business.facebook.com/)
2. Solicitar acesso à WhatsApp Business API
3. Configurar número de telefone e verificação
4. Configurar webhook para receber mensagens

## Publicação nas Lojas

### App Store (iOS)

1. Criar conta no [Apple Developer Program](https://developer.apple.com/)
2. Configurar certificados e perfis de provisionamento
3. Preparar assets (ícones, screenshots, descrições)
4. Enviar para revisão através do App Store Connect

### Google Play Store (Android)

1. Criar conta no [Google Play Console](https://play.google.com/console/about/)
2. Configurar a ficha do aplicativo
3. Preparar assets (ícones, screenshots, descrições)
4. Gerar APK/AAB assinado e enviar para revisão

## Considerações de Segurança

- Implementar autenticação segura
- Proteger chaves de API e credenciais
- Configurar regras de segurança no Firestore
- Implementar validação de entrada de dados
- Usar HTTPS para todas as comunicações
- Implementar controle de acesso baseado em funções (RBAC)
- Seguir as melhores práticas de segurança para aplicativos móveis

## Monitoramento e Análise

- Implementar Firebase Analytics para rastrear uso do aplicativo
- Configurar Firebase Crashlytics para monitorar falhas
- Implementar logging para depuração
- Configurar alertas para problemas críticos

## Próximos Passos

1. Configurar ambiente de desenvolvimento
2. Implementar autenticação e perfis de usuário
3. Desenvolver a interface do usuário seguindo o protótipo
4. Implementar integração com Vimeo
5. Desenvolver a assistente virtual Cora
6. Implementar integração com WhatsApp
7. Configurar modelo freemium e integração com Hotmart
8. Realizar testes abrangentes
9. Preparar para publicação nas lojas
10. Lançar o aplicativo

## Contato para Suporte

Para quaisquer dúvidas técnicas durante a implementação, entre em contato com:
- Email: contato@mundoemcores.com
