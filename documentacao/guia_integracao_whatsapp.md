# Guia de Integração com WhatsApp Business API

## Visão Geral

Este documento fornece instruções detalhadas para implementar a integração da assistente virtual Cora com o WhatsApp Business API no aplicativo MundoemCores.com. Esta integração permitirá que os usuários interajam com a Cora diretamente pelo WhatsApp, além do aplicativo.

## Pré-requisitos

1. Conta no Facebook Business Manager
2. Acesso à WhatsApp Business API (requer aprovação)
3. Número de telefone dedicado para WhatsApp Business
4. Servidor para hospedar webhook (Firebase Cloud Functions)
5. Certificado SSL para o endpoint do webhook

## Configuração do WhatsApp Business API

### 1. Solicitar Acesso à API

1. Acesse o [Facebook Business Manager](https://business.facebook.com/)
2. Crie uma conta de negócios se ainda não tiver uma
3. Navegue até "Configurações" > "Contas de Negócios" > "WhatsApp Accounts"
4. Clique em "Add" e siga as instruções para solicitar acesso à API
5. Aguarde a aprovação (pode levar alguns dias)

### 2. Configurar Número de Telefone

1. Após a aprovação, acesse o WhatsApp Manager
2. Clique em "Add Phone Number"
3. Siga as instruções para verificar o número de telefone
4. Configure o nome de exibição e a mensagem de saudação

### 3. Criar Aplicativo no Facebook Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com/)
2. Crie um novo aplicativo do tipo "Business"
3. Adicione o produto "WhatsApp" ao seu aplicativo
4. Obtenha o token de acesso permanente

## Implementação no Backend

### 1. Configuração do Firebase Cloud Functions

Primeiro, instale as dependências necessárias:

```bash
npm install axios firebase-admin firebase-functions
```

### 2. Implementação do Webhook

Crie um arquivo `whatsappWebhook.js` na pasta `functions`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuração do WhatsApp Business API
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = 'SEU_PHONE_NUMBER_ID'; // Substitua pelo ID real
const WHATSAPP_ACCESS_TOKEN = 'SEU_ACCESS_TOKEN'; // Substitua pelo token real

// Webhook para receber mensagens do WhatsApp
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // Verificação do webhook (GET request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Verificar token (deve ser o mesmo configurado no WhatsApp Business API)
    const VERIFY_TOKEN = 'mundoemcores_webhook_token'; // Substitua por um token seguro
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado com sucesso');
      res.status(200).send(challenge);
    } else {
      console.error('Falha na verificação do webhook');
      res.status(403).send('Verificação falhou');
    }
    return;
  }
  
  // Processamento de mensagens recebidas (POST request)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Verificar se é uma mensagem válida do WhatsApp
      if (
        body.object === 'whatsapp_business_account' && 
        body.entry && 
        body.entry.length > 0 && 
        body.entry[0].changes && 
        body.entry[0].changes.length > 0 && 
        body.entry[0].changes[0].value.messages && 
        body.entry[0].changes[0].value.messages.length > 0
      ) {
        // Extrair informações da mensagem
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from; // Número de telefone do remetente
        
        // Processar diferentes tipos de mensagens
        let messageText = '';
        
        if (message.type === 'text') {
          messageText = message.text.body;
        } else if (message.type === 'interactive' && message.interactive.button_reply) {
          messageText = message.interactive.button_reply.title;
        } else if (message.type === 'interactive' && message.interactive.list_reply) {
          messageText = message.interactive.list_reply.title;
        } else {
          // Mensagem não suportada (imagem, áudio, etc.)
          await sendWhatsAppMessage(
            from, 
            'Desculpe, atualmente só consigo processar mensagens de texto. Por favor, digite sua pergunta.'
          );
          res.status(200).send('OK');
          return;
        }
        
        // Verificar se o usuário já existe no sistema
        const userSnapshot = await db.collection('whatsappUsers')
          .where('phoneNumber', '==', from)
          .limit(1)
          .get();
        
        let userId;
        let conversationId;
        
        if (userSnapshot.empty) {
          // Criar novo usuário
          const userRef = await db.collection('whatsappUsers').add({
            phoneNumber: from,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          userId = userRef.id;
          
          // Criar nova conversa
          const conversationRef = await db.collection('whatsappUsers')
            .doc(userId)
            .collection('conversations')
            .add({
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            });
          
          conversationId = conversationRef.id;
          
          // Enviar mensagem de boas-vindas
          await sendWhatsAppMessage(
            from,
            'Olá! Sou a Cora, assistente virtual do MundoemCores.com. Estou aqui para ajudar com dúvidas sobre desenvolvimento infantil, educação de filhos e nossos cursos. Como posso ajudar você hoje?'
          );
        } else {
          // Usuário existente
          userId = userSnapshot.docs[0].id;
          
          // Buscar conversa ativa ou criar uma nova
          const conversationsSnapshot = await db.collection('whatsappUsers')
            .doc(userId)
            .collection('conversations')
            .orderBy('lastMessageTime', 'desc')
            .limit(1)
            .get();
          
          if (conversationsSnapshot.empty) {
            // Criar nova conversa
            const conversationRef = await db.collection('whatsappUsers')
              .doc(userId)
              .collection('conversations')
              .add({
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
              });
            
            conversationId = conversationRef.id;
          } else {
            conversationId = conversationsSnapshot.docs[0].id;
          }
          
          // Atualizar timestamp de última atividade
          await db.collection('whatsappUsers')
            .doc(userId)
            .update({
              lastActivity: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        
        // Salvar mensagem do usuário
        await db.collection('whatsappUsers')
          .doc(userId)
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .add({
            sender: 'user',
            text: messageText,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        
        // Atualizar metadados da conversa
        await db.collection('whatsappUsers')
          .doc(userId)
          .collection('conversations')
          .doc(conversationId)
          .update({
            lastMessage: messageText,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            lastMessageSender: 'user',
          });
        
        // Marcar mensagem como lida
        await markMessageAsRead(message.id);
        
        // Enviar indicação de "digitando"
        await sendTypingIndicator(from);
        
        // Processar a mensagem com a Cora
        try {
          // Importar o serviço da Cora
          const { generateCoraResponse } = require('../services/cora/coraService');
          
          // Gerar resposta da Cora
          const coraResponse = await generateCoraResponse(messageText, userId, conversationId);
          
          // Enviar resposta via WhatsApp
          await sendWhatsAppMessage(from, coraResponse);
          
          // Salvar resposta da Cora
          await db.collection('whatsappUsers')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add({
              sender: 'cora',
              text: coraResponse,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          
          // Atualizar metadados da conversa
          await db.collection('whatsappUsers')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .update({
              lastMessage: coraResponse,
              lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
              lastMessageSender: 'cora',
            });
        } catch (error) {
          console.error('Erro ao processar mensagem com a Cora:', error);
          
          // Enviar mensagem de erro
          await sendWhatsAppMessage(
            from,
            'Desculpe, estou com dificuldades para processar sua mensagem no momento. Por favor, tente novamente em alguns instantes ou entre em contato com nosso suporte pelo email contato@mundoemcores.com.'
          );
        }
        
        res.status(200).send('OK');
      } else {
        // Não é uma mensagem válida
        console.log('Recebido evento não relacionado a mensagens');
        res.status(200).send('OK');
      }
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).send('Erro interno');
    }
  } else {
    // Método não suportado
    res.status(405).send('Método não permitido');
  }
});

/**
 * Envia uma mensagem via WhatsApp API
 * @param {string} to - Número de telefone do destinatário
 * @param {string} text - Texto da mensagem
 * @returns {Promise<object>} - Resposta da API
 */
const sendWhatsAppMessage = async (to, text) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: text
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Marca uma mensagem como lida
 * @param {string} messageId - ID da mensagem
 * @returns {Promise<object>} - Resposta da API
 */
const markMessageAsRead = async (messageId) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error.response?.data || error.message);
    // Não lançar erro para não interromper o fluxo principal
  }
};

/**
 * Envia indicação de "digitando"
 * @param {string} to - Número de telefone do destinatário
 * @returns {Promise<object>} - Resposta da API
 */
const sendTypingIndicator = async (to) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'reaction',
        reaction: {
          message_id: 'dummy_id', // Não é usado, mas necessário para a API
          emoji: '⌛' // Emoji de ampulheta
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar indicação de digitação:', error.response?.data || error.message);
    // Não lançar erro para não interromper o fluxo principal
  }
};
```

### 3. Serviço de Integração WhatsApp-Cora

Crie um arquivo `coraWhatsAppIntegration.js` na pasta `services/whatsapp`:

```javascript
const axios = require('axios');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { generateCoraResponse } = require('../cora/coraService');

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuração do WhatsApp Business API
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = 'SEU_PHONE_NUMBER_ID'; // Substitua pelo ID real
const WHATSAPP_ACCESS_TOKEN = 'SEU_ACCESS_TOKEN'; // Substitua pelo token real

/**
 * Envia uma mensagem proativa para um usuário
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {string} message - Texto da mensagem
 * @param {string} templateName - Nome do template (opcional)
 * @returns {Promise<object>} - Resposta da API
 */
const sendProactiveMessage = async (phoneNumber, message, templateName = null) => {
  try {
    // Verificar se o usuário existe
    const userSnapshot = await db.collection('whatsappUsers')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      throw new Error(`Usuário com número ${phoneNumber} não encontrado`);
    }
    
    const userId = userSnapshot.docs[0].id;
    
    // Buscar ou criar conversa
    const conversationsSnapshot = await db.collection('whatsappUsers')
      .doc(userId)
      .collection('conversations')
      .orderBy('lastMessageTime', 'desc')
      .limit(1)
      .get();
    
    let conversationId;
    
    if (conversationsSnapshot.empty) {
      // Criar nova conversa
      const conversationRef = await db.collection('whatsappUsers')
        .doc(userId)
        .collection('conversations')
        .add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      conversationId = conversationRef.id;
    } else {
      conversationId = conversationsSnapshot.docs[0].id;
    }
    
    // Enviar mensagem via WhatsApp API
    let response;
    
    if (templateName) {
      // Enviar mensagem usando template
      response = await axios({
        method: 'POST',
        url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'pt_BR'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: message
                  }
                ]
              }
            ]
          }
        }
      });
    } else {
      // Enviar mensagem de texto normal
      response = await axios({
        method: 'POST',
        url: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            body: message
          }
        }
      });
    }
    
    // Salvar mensagem no histórico
    await db.collection('whatsappUsers')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .add({
        sender: 'cora',
        text: message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isProactive: true
      });
    
    // Atualizar metadados da conversa
    await db.collection('whatsappUsers')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .update({
        lastMessage: message,
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSender: 'cora',
      });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem proativa:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Envia uma notificação de novo curso
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {object} courseInfo - Informações do curso
 * @returns {Promise<object>} - Resposta da API
 */
const sendNewCourseNotification = async (phoneNumber, courseInfo) => {
  try {
    const message = `Olá! Temos um novo curso disponível: "${courseInfo.title}". ${courseInfo.description}. Acesse o aplicativo MundoemCores para saber mais!`;
    
    return await sendProactiveMessage(phoneNumber, message, 'new_course_notification');
  } catch (error) {
    console.error('Erro ao enviar notificação de novo curso:', error);
    throw error;
  }
};

/**
 * Envia um lembrete para continuar curso
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {object} courseInfo - Informações do curso
 * @returns {Promise<object>} - Resposta da API
 */
const sendCourseReminderNotification = async (phoneNumber, courseInfo) => {
  try {
    const message = `Olá! Notei que você começou o curso "${courseInfo.title}" mas não concluiu. Que tal continuar de onde parou? Acesse o aplicativo MundoemCores para retomar seus estudos!`;
    
    return await sendProactiveMessage(phoneNumber, message, 'course_reminder');
  } catch (error) {
    console.error('Erro ao enviar lembrete de curso:', error);
    throw error;
  }
};

/**
 * Envia uma dica educacional personalizada
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {string} topic - Tópico da dica
 * @returns {Promise<object>} - Resposta da API
 */
const sendEducationalTip = async (phoneNumber, topic) => {
  try {
    // Gerar dica personalizada com a Cora
    const tipPrompt = `Gere uma dica educacional curta e prática sobre ${topic} para pais. A dica deve ter no máximo 3 frases.`;
    
    // Buscar usuário
    const userSnapshot = await db.collection('whatsappUsers')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      throw new Error(`Usuário com número ${phoneNumber} não encontrado`);
    }
    
    const userId = userSnapshot.docs[0].id;
    
    // Gerar dica com a Cora
    const tip = await generateCoraResponse(tipPrompt, userId, 'tips');
    
    // Enviar dica via WhatsApp
    return await sendProactiveMessage(phoneNumber, tip, 'educational_tip');
  } catch (error) {
    console.error('Erro ao enviar dica educacional:', error);
    throw error;
  }
};

/**
 * Envia uma mensagem de boas-vindas para novo usuário
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {string} userName - Nome do usuário
 * @returns {Promise<object>} - Resposta da API
 */
const sendWelcomeMessage = async (phoneNumber, userName) => {
  try {
    const message = `Olá ${userName || ''}! Bem-vindo(a) ao MundoemCores. Sou a Cora, sua assistente virtual. Estou aqui para ajudar com dúvidas sobre desenvolvimento infantil, educação de filhos e nossos cursos. Como posso ajudar você hoje?`;
    
    return await sendProactiveMessage(phoneNumber, message, 'welcome_message');
  } catch (error) {
    console.error('Erro ao enviar mensagem de boas-vindas:', error);
    throw error;
  }
};

// Exportar funções
module.exports = {
  sendProactiveMessage,
  sendNewCourseNotification,
  sendCourseReminderNotification,
  sendEducationalTip,
  sendWelcomeMessage
};
```

### 4. Configuração do index.js para Cloud Functions

Atualize o arquivo `index.js` na pasta `functions`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Importar funções do webhook
const { whatsappWebhook } = require('./whatsappWebhook');

// Exportar funções
exports.whatsappWebhook = whatsappWebhook;

// Função para enviar notificações de novos cursos
exports.sendNewCourseNotifications = functions.firestore
  .document('courses/{courseId}')
  .onCreate(async (snapshot, context) => {
    try {
      const courseData = snapshot.data();
      
      // Verificar se o curso deve gerar notificações
      if (!courseData.sendNotifications) {
        console.log('Notificações desativadas para este curso');
        return null;
      }
      
      // Importar serviço de integração
      const { sendNewCourseNotification } = require('./services/whatsapp/coraWhatsAppIntegration');
      
      // Buscar usuários que optaram por receber notificações
      const usersSnapshot = await admin.firestore()
        .collection('whatsappUsers')
        .where('notificationsEnabled', '==', true)
        .get();
      
      // Enviar notificações
      const promises = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        promises.push(
          sendNewCourseNotification(userData.phoneNumber, {
            title: courseData.title,
            description: courseData.shortDescription || 'Novo curso disponível'
          })
        );
      });
      
      await Promise.all(promises);
      
      console.log(`Notificações enviadas para ${promises.length} usuários`);
      return null;
    } catch (error) {
      console.error('Erro ao enviar notificações de novo curso:', error);
      return null;
    }
  });

// Função para enviar lembretes de cursos não concluídos
exports.sendCourseReminders = functions.pubsub
  .schedule('0 18 * * *') // Todos os dias às 18:00
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      // Importar serviço de integração
      const { sendCourseReminderNotification } = require('./services/whatsapp/coraWhatsAppIntegration');
      
      // Buscar usuários com cursos não concluídos
      const now = admin.firestore.Timestamp.now();
      const twoWeeksAgo = new Date(now.toDate().getTime() - (14 * 24 * 60 * 60 * 1000));
      
      const progressSnapshot = await admin.firestore()
        .collectionGroup('courseProgress')
        .where('lastActivity', '<=', admin.firestore.Timestamp.fromDate(twoWeeksAgo))
        .where('completed', '==', false)
        .get();
      
      // Agrupar por usuário para evitar múltiplas notificações
      const userCourses = {};
      
      for (const doc of progressSnapshot.docs) {
        const progressData = doc.data();
        const userId = doc.ref.path.split('/')[1]; // Extrair userId do caminho
        
        if (!userCourses[userId]) {
          userCourses[userId] = [];
        }
        
        // Buscar detalhes do curso
        const courseDoc = await admin.firestore()
          .collection('courses')
          .doc(progressData.courseId)
          .get();
        
        if (courseDoc.exists) {
          userCourses[userId].push({
            id: progressData.courseId,
            title: courseDoc.data().title,
            progress: progressData.progress
          });
        }
      }
      
      // Enviar lembretes
      const promises = [];
      
      for (const [userId, courses] of Object.entries(userCourses)) {
        // Buscar usuário
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(userId)
          .get();
        
        if (userDoc.exists && userDoc.data().whatsappNumber && userDoc.data().reminderNotificationsEnabled) {
          // Selecionar o curso com maior progresso
          const course = courses.sort((a, b) => b.progress - a.progress)[0];
          
          promises.push(
            sendCourseReminderNotification(userDoc.data().whatsappNumber, {
              title: course.title,
              progress: course.progress
            })
          );
        }
      }
      
      await Promise.all(promises);
      
      console.log(`Lembretes enviados para ${promises.length} usuários`);
      return null;
    } catch (error) {
      console.error('Erro ao enviar lembretes de cursos:', error);
      return null;
    }
  });

// Função para enviar dicas educacionais semanais
exports.sendWeeklyTips = functions.pubsub
  .schedule('0 10 * * 2') // Toda terça-feira às 10:00
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      // Importar serviço de integração
      const { sendEducationalTip } = require('./services/whatsapp/coraWhatsAppIntegration');
      
      // Tópicos para dicas
      const topics = [
        'desenvolvimento cerebral infantil',
        'disciplina positiva',
        'método montessori',
        'comunicação não-violenta com crianças',
        'autonomia infantil',
        'gestão de emoções na infância'
      ];
      
      // Selecionar tópico aleatório
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Buscar usuários que optaram por receber dicas
      const usersSnapshot = await admin.firestore()
        .collection('whatsappUsers')
        .where('tipsEnabled', '==', true)
        .get();
      
      // Enviar dicas
      const promises = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        promises.push(
          sendEducationalTip(userData.phoneNumber, randomTopic)
        );
      });
      
      await Promise.all(promises);
      
      console.log(`Dicas enviadas para ${promises.length} usuários`);
      return null;
    } catch (error) {
      console.error('Erro ao enviar dicas educacionais:', error);
      return null;
    }
  });
```

## Implementação no Aplicativo

### 1. Tela de Configurações do WhatsApp

Crie um arquivo `WhatsAppSettingsScreen.js` na pasta `screens`:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext'; // Ajuste conforme sua implementação
import firestore from '@react-native-firebase/firestore';
import { sendTestMessage } from '../services/whatsapp/whatsappService';

const WhatsAppSettingsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderNotificationsEnabled, setReminderNotificationsEnabled] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  
  // Carregar configurações do usuário
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          if (userData.whatsappNumber) {
            setWhatsappNumber(userData.whatsappNumber);
            setIsConnected(true);
          }
          
          setNotificationsEnabled(userData.notificationsEnabled !== false);
          setReminderNotificationsEnabled(userData.reminderNotificationsEnabled !== false);
          setTipsEnabled(userData.tipsEnabled !== false);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        Alert.alert('Erro', 'Não foi possível carregar suas configurações. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  // Salvar configurações
  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Validar número de WhatsApp
      if (whatsappNumber && !isValidWhatsAppNumber(whatsappNumber)) {
        Alert.alert('Número Inválido', 'Por favor, insira um número de WhatsApp válido, incluindo o código do país. Exemplo: +5511999999999');
        setSaving(false);
        return;
      }
      
      // Verificar se o número mudou
      const isNewConnection = whatsappNumber && !isConnected;
      
      // Atualizar configurações no Firestore
      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          whatsappNumber: whatsappNumber || null,
          notificationsEnabled,
          reminderNotificationsEnabled,
          tipsEnabled,
          whatsappUpdatedAt: firestore.FieldValue.serverTimestamp()
        });
      
      // Se for uma nova conexão, criar registro na coleção whatsappUsers
      if (isNewConnection) {
        // Verificar se já existe um registro para este número
        const whatsappUserSnapshot = await firestore()
          .collection('whatsappUsers')
          .where('phoneNumber', '==', whatsappNumber)
          .limit(1)
          .get();
        
        if (whatsappUserSnapshot.empty) {
          // Criar novo registro
          await firestore()
            .collection('whatsappUsers')
            .add({
              phoneNumber: whatsappNumber,
              userId: user.uid,
              notificationsEnabled,
              reminderNotificationsEnabled,
              tipsEnabled,
              createdAt: firestore.FieldValue.serverTimestamp(),
              lastActivity: firestore.FieldValue.serverTimestamp(),
            });
        } else {
          // Atualizar registro existente
          await whatsappUserSnapshot.docs[0].ref.update({
            userId: user.uid,
            notificationsEnabled,
            reminderNotificationsEnabled,
            tipsEnabled,
            lastActivity: firestore.FieldValue.serverTimestamp(),
          });
        }
        
        setIsConnected(true);
        
        // Enviar mensagem de boas-vindas
        try {
          const { sendWelcomeMessage } = require('../services/whatsapp/coraWhatsAppIntegration');
          await sendWelcomeMessage(whatsappNumber, user.displayName);
        } catch (error) {
          console.error('Erro ao enviar mensagem de boas-vindas:', error);
          // Não bloquear o fluxo principal
        }
      }
      
      Alert.alert('Sucesso', 'Suas configurações de WhatsApp foram salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas configurações. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  
  // Validar número de WhatsApp
  const isValidWhatsAppNumber = (number) => {
    // Formato básico: +XXXXXXXXXXXX (código do país + número)
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(number);
  };
  
  // Enviar mensagem de teste
  const sendTestWhatsAppMessage = async () => {
    if (!whatsappNumber) {
      Alert.alert('Erro', 'Por favor, insira um número de WhatsApp válido primeiro.');
      return;
    }
    
    try {
      setSendingTest(true);
      
      await sendTestMessage(whatsappNumber);
      
      Alert.alert(
        'Mensagem Enviada',
        'Uma mensagem de teste foi enviada para o seu WhatsApp. Por favor, verifique se você a recebeu. Se não receber em alguns minutos, verifique se o número está correto.'
      );
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem de teste. Por favor, verifique o número e tente novamente.');
    } finally {
      setSendingTest(false);
    }
  };
  
  // Desconectar WhatsApp
  const disconnectWhatsApp = async () => {
    Alert.alert(
      'Desconectar WhatsApp',
      'Tem certeza que deseja desconectar seu WhatsApp? Você não receberá mais mensagens da Cora por este canal.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Atualizar usuário
              await firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                  whatsappNumber: null,
                  whatsappUpdatedAt: firestore.FieldValue.serverTimestamp()
                });
              
              // Buscar e atualizar registro na coleção whatsappUsers
              if (whatsappNumber) {
                const whatsappUserSnapshot = await firestore()
                  .collection('whatsappUsers')
                  .where('phoneNumber', '==', whatsappNumber)
                  .where('userId', '==', user.uid)
                  .limit(1)
                  .get();
                
                if (!whatsappUserSnapshot.empty) {
                  await whatsappUserSnapshot.docs[0].ref.update({
                    userId: null,
                    notificationsEnabled: false,
                    reminderNotificationsEnabled: false,
                    tipsEnabled: false,
                    disconnectedAt: firestore.FieldValue.serverTimestamp(),
                  });
                }
              }
              
              setWhatsappNumber('');
              setIsConnected(false);
              
              Alert.alert('Sucesso', 'Seu WhatsApp foi desconectado com sucesso.');
            } catch (error) {
              console.error('Erro ao desconectar WhatsApp:', error);
              Alert.alert('Erro', 'Não foi possível desconectar seu WhatsApp. Por favor, tente novamente.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b72f2f" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="whatsapp" size={40} color="#25D366" />
        <Text style={styles.headerTitle}>Configurações do WhatsApp</Text>
      </View>
      
      <Text style={styles.description}>
        Conecte seu WhatsApp para interagir com a Cora, receber notificações sobre novos cursos e dicas educacionais personalizadas.
      </Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conectar WhatsApp</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Número do WhatsApp (ex: +5511999999999)"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
            editable={!saving}
          />
          <Text style={styles.inputHelp}>
            Inclua o código do país e DDD. Exemplo: +5511999999999
          </Text>
        </View>
        
        {isConnected ? (
          <View style={styles.connectedContainer}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.connectedText}>WhatsApp conectado</Text>
          </View>
        ) : null}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.testButton, (saving || sendingTest) && styles.disabledButton]}
            onPress={sendTestWhatsAppMessage}
            disabled={saving || sendingTest || !whatsappNumber}
          >
            {sendingTest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.buttonText}>Enviar Teste</Text>
              </>
            )}
          </TouchableOpacity>
          
          {isConnected && (
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton, saving && styles.disabledButton]}
              onPress={disconnectWhatsApp}
              disabled={saving}
            >
              <Icon name="link-off" size={20} color="#fff" />
              <Text style={styles.buttonText}>Desconectar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Novos cursos e conteúdos</Text>
            <Text style={styles.switchDescription}>
              Receba notificações quando novos cursos e conteúdos forem adicionados
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#d1d1d1', true: '#9cac3b' }}
            thumbColor={notificationsEnabled ? '#367c53' : '#f4f3f4'}
            disabled={saving || !isConnected}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Lembretes de cursos</Text>
            <Text style={styles.switchDescription}>
              Receba lembretes para continuar cursos que você começou
            </Text>
          </View>
          <Switch
            value={reminderNotificationsEnabled}
            onValueChange={setReminderNotificationsEnabled}
            trackColor={{ false: '#d1d1d1', true: '#9cac3b' }}
            thumbColor={reminderNotificationsEnabled ? '#367c53' : '#f4f3f4'}
            disabled={saving || !isConnected}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Dicas educacionais</Text>
            <Text style={styles.switchDescription}>
              Receba dicas semanais sobre desenvolvimento infantil e educação
            </Text>
          </View>
          <Switch
            value={tipsEnabled}
            onValueChange={setTipsEnabled}
            trackColor={{ false: '#d1d1d1', true: '#9cac3b' }}
            thumbColor={tipsEnabled ? '#367c53' : '#f4f3f4'}
            disabled={saving || !isConnected}
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={saveSettings}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Salvar Configurações</Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Icon name="info" size={20} color="#666" />
        <Text style={styles.infoText}>
          Ao conectar seu WhatsApp, você concorda em receber mensagens da Cora. Você pode desconectar ou ajustar suas preferências a qualquer momento.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23364e',
    marginLeft: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  connectedText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    flex: 1,
  },
  testButton: {
    backgroundColor: '#25D366',
    marginRight: 10,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#b72f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
});

export default WhatsAppSettingsScreen;
```

### 2. Serviço de WhatsApp para o Aplicativo

Crie um arquivo `whatsappService.js` na pasta `services/whatsapp`:

```javascript
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

/**
 * Envia uma mensagem de teste para o WhatsApp
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @returns {Promise<object>} - Resposta da função
 */
const sendTestMessage = async (phoneNumber) => {
  try {
    // Chamar função Cloud Function
    const result = await functions().httpsCallable('sendTestWhatsAppMessage')({
      phoneNumber
    });
    
    return result.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário tem WhatsApp conectado
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} - Se o usuário tem WhatsApp conectado
 */
const isWhatsAppConnected = async (userId) => {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    return userDoc.exists && !!userDoc.data().whatsappNumber;
  } catch (error) {
    console.error('Erro ao verificar conexão WhatsApp:', error);
    return false;
  }
};

/**
 * Obtém histórico de conversas do WhatsApp
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} - Lista de conversas
 */
const getWhatsAppConversations = async (userId) => {
  try {
    // Buscar número de WhatsApp do usuário
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists || !userDoc.data().whatsappNumber) {
      return [];
    }
    
    const phoneNumber = userDoc.data().whatsappNumber;
    
    // Buscar usuário WhatsApp
    const whatsappUserSnapshot = await firestore()
      .collection('whatsappUsers')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (whatsappUserSnapshot.empty) {
      return [];
    }
    
    const whatsappUserId = whatsappUserSnapshot.docs[0].id;
    
    // Buscar conversas
    const conversationsSnapshot = await firestore()
      .collection('whatsappUsers')
      .doc(whatsappUserId)
      .collection('conversations')
      .orderBy('lastMessageTime', 'desc')
      .get();
    
    return conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar conversas WhatsApp:', error);
    return [];
  }
};

/**
 * Obtém mensagens de uma conversa do WhatsApp
 * @param {string} userId - ID do usuário
 * @param {string} conversationId - ID da conversa
 * @returns {Promise<Array>} - Lista de mensagens
 */
const getWhatsAppMessages = async (userId, conversationId) => {
  try {
    // Buscar número de WhatsApp do usuário
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists || !userDoc.data().whatsappNumber) {
      return [];
    }
    
    const phoneNumber = userDoc.data().whatsappNumber;
    
    // Buscar usuário WhatsApp
    const whatsappUserSnapshot = await firestore()
      .collection('whatsappUsers')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (whatsappUserSnapshot.empty) {
      return [];
    }
    
    const whatsappUserId = whatsappUserSnapshot.docs[0].id;
    
    // Buscar mensagens
    const messagesSnapshot = await firestore()
      .collection('whatsappUsers')
      .doc(whatsappUserId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
    
    return messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar mensagens WhatsApp:', error);
    return [];
  }
};

export {
  sendTestMessage,
  isWhatsAppConnected,
  getWhatsAppConversations,
  getWhatsAppMessages
};
```

### 3. Adicionar Tela de Configurações ao Navegador

Atualize o arquivo de navegação para incluir a tela de configurações do WhatsApp:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Importar telas
import HomeScreen from './screens/HomeScreen';
import CoursesScreen from './screens/CoursesScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import WhatsAppSettingsScreen from './screens/WhatsAppSettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de configurações
const SettingsNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      <Stack.Screen 
        name="WhatsAppSettings" 
        component={WhatsAppSettingsScreen} 
        options={{ title: 'WhatsApp' }} 
      />
    </Stack.Navigator>
  );
};

// Navegador principal
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Courses') {
            iconName = 'school';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'SettingsTab') {
            iconName = 'settings';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#b72f2f',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: 'Cursos' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'Configurações' }} />
    </Tab.Navigator>
  );
};

// Navegador raiz
const RootNavigator = () => {
  return (
    <Stack.Navigator mode="modal">
      <Stack.Screen 
        name="Main" 
        component={MainNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen} 
        options={({ route }) => ({ title: route.params.title })} 
      />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
```

## Implantação

### 1. Configuração do Firebase

1. Atualize as regras de segurança do Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usuários WhatsApp
    match /whatsappUsers/{whatsappUserId} {
      allow read: if false; // Apenas acesso via backend
      allow write: if false;
      
      // Conversas
      match /conversations/{conversationId} {
        allow read: if false;
        allow write: if false;
        
        // Mensagens
        match /messages/{messageId} {
          allow read: if false;
          allow write: if false;
        }
      }
    }
    
    // Base de conhecimento da Cora
    match /coraKnowledge/{documentId} {
      allow read: if request.auth != null;
      allow write: if false; // Apenas acesso via backend
    }
    
    // Cursos são públicos para leitura
    match /courses/{courseId} {
      allow read: if true;
      allow write: if false; // Apenas acesso via backend
    }
  }
}
```

2. Implante as Cloud Functions:

```bash
firebase deploy --only functions
```

### 2. Configuração do WhatsApp Business API

1. Configure o webhook no Facebook Developers:
   - URL: `https://seu-projeto.cloudfunctions.net/whatsappWebhook`
   - Token de verificação: `mundoemcores_webhook_token` (ou o que você definiu)
   - Eventos: `messages`

2. Configure mensagens de modelo (templates) no WhatsApp Manager:
   - `welcome_message`: Mensagem de boas-vindas
   - `new_course_notification`: Notificação de novo curso
   - `course_reminder`: Lembrete de curso
   - `educational_tip`: Dica educacional

## Testes

### 1. Teste de Webhook

1. Envie uma mensagem para o número do WhatsApp Business
2. Verifique os logs das Cloud Functions para confirmar que o webhook está recebendo a mensagem
3. Verifique se a resposta da Cora é enviada corretamente

### 2. Teste de Notificações

1. Crie um novo curso no Firestore com `sendNotifications: true`
2. Verifique se a notificação é enviada para os usuários que optaram por receber notificações

### 3. Teste de Integração no Aplicativo

1. Acesse a tela de configurações do WhatsApp no aplicativo
2. Conecte um número de WhatsApp
3. Envie uma mensagem de teste
4. Verifique se a mensagem é recebida no WhatsApp

## Considerações de Segurança

1. **Proteção de Dados**: Não armazene informações sensíveis nas mensagens
2. **Limitação de Acesso**: Restrinja o acesso às Cloud Functions e dados do Firestore
3. **Validação de Entrada**: Valide todos os dados de entrada antes de processá-los
4. **Monitoramento**: Configure alertas para atividades suspeitas
5. **Conformidade**: Certifique-se de estar em conformidade com as políticas do WhatsApp Business

## Recursos Adicionais

- [Documentação do WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/api/reference)
- [Guia de Melhores Práticas do WhatsApp Business](https://developers.facebook.com/docs/whatsapp/guides)
- [Documentação do Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Documentação do Firestore](https://firebase.google.com/docs/firestore)

## Suporte

Para questões relacionadas à integração com WhatsApp, entre em contato com:
- Email: contato@mundoemcores.com
