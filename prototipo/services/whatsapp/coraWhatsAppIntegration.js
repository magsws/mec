/**
 * Integração entre a Assistente Cora e o WhatsApp
 * Responsável por conectar o serviço da Cora com o serviço do WhatsApp
 */

import coraService from '../cora/coraService';
import whatsappService from './whatsappService';

/**
 * Classe de integração entre Cora e WhatsApp
 * Gerencia o fluxo de mensagens entre os serviços
 */
class CoraWhatsAppIntegration {
  constructor() {
    // Mapeamento de conversas do WhatsApp para conversas da Cora
    this.conversationMapping = {};
    
    // Configurações
    this.autoReplyDelay = 500; // Delay para simular digitação (ms)
  }

  /**
   * Processa uma mensagem recebida do WhatsApp e envia resposta da Cora
   * @param {Object} webhookData - Dados recebidos do webhook do WhatsApp
   * @returns {Promise<Object>} - Resultado do processamento
   */
  async processIncomingMessage(webhookData) {
    try {
      // Processa os dados do webhook
      const messageData = whatsappService.processWebhookMessage(webhookData);
      
      if (!messageData) {
        throw new Error('Falha ao processar dados do webhook');
      }
      
      const { sender, messageContent, messageId } = messageData;
      
      // Marca a mensagem como lida
      await whatsappService.markMessageAsRead(messageId);
      
      // Obtém ou cria ID de conversa da Cora para este remetente
      let coraConversationId = this.conversationMapping[sender];
      if (!coraConversationId) {
        coraConversationId = coraService.initConversation(`whatsapp_${sender}`);
        this.conversationMapping[sender] = coraConversationId;
      }
      
      // Processa a mensagem com a Cora
      const coraResponse = await coraService.processMessage(coraConversationId, messageContent);
      
      // Simula delay de digitação
      await new Promise(resolve => setTimeout(resolve, this.autoReplyDelay));
      
      // Envia resposta da Cora via WhatsApp
      const sendResult = await whatsappService.sendTextMessage(sender, coraResponse);
      
      return {
        success: true,
        sender,
        messageReceived: messageContent,
        responseId: sendResult.messages[0].id
      };
    } catch (error) {
      console.error('Erro ao processar mensagem do WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia uma mensagem proativa para um usuário via WhatsApp
   * @param {string} phoneNumber - Número de telefone do usuário
   * @param {string} message - Mensagem a ser enviada
   * @returns {Promise<Object>} - Resultado do envio
   */
  async sendProactiveMessage(phoneNumber, message) {
    try {
      const result = await whatsappService.sendTextMessage(phoneNumber, message);
      return {
        success: true,
        messageId: result.messages[0].id
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem proativa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia uma notificação de template para um usuário via WhatsApp
   * @param {string} phoneNumber - Número de telefone do usuário
   * @param {string} templateName - Nome do template
   * @param {Array} parameters - Parâmetros do template
   * @returns {Promise<Object>} - Resultado do envio
   */
  async sendTemplateNotification(phoneNumber, templateName, parameters = []) {
    try {
      // Prepara os componentes do template
      const components = [];
      
      if (parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: parameters.map((param, index) => ({
            type: 'text',
            text: param
          }))
        });
      }
      
      const result = await whatsappService.sendTemplateMessage(phoneNumber, templateName, components);
      
      return {
        success: true,
        messageId: result.messages[0].id
      };
    } catch (error) {
      console.error('Erro ao enviar notificação de template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia uma mensagem de boas-vindas para um novo usuário
   * @param {string} phoneNumber - Número de telefone do usuário
   * @param {string} userName - Nome do usuário
   * @returns {Promise<Object>} - Resultado do envio
   */
  async sendWelcomeMessage(phoneNumber, userName) {
    const welcomeMessage = `Olá ${userName || ''}! 👋\n\nEu sou a Cora, assistente virtual do MundoemCores.com.\n\nEstou aqui para ajudar com suas dúvidas sobre educação infantil, desenvolvimento cerebral e para auxiliar na navegação pela plataforma.\n\nComo posso ajudar você hoje?`;
    
    return this.sendProactiveMessage(phoneNumber, welcomeMessage);
  }

  /**
   * Limpa uma conversa específica
   * @param {string} phoneNumber - Número de telefone do usuário
   * @returns {boolean} - Sucesso da operação
   */
  clearConversation(phoneNumber) {
    const coraConversationId = this.conversationMapping[phoneNumber];
    
    if (coraConversationId) {
      const result = coraService.clearConversation(coraConversationId);
      return result;
    }
    
    return false;
  }

  /**
   * Configura um webhook para receber mensagens do WhatsApp
   * @param {Object} app - Instância do Express ou similar
   */
  setupWebhook(app) {
    // Em uma implementação real, isso configuraria rotas para o webhook
    // Exemplo com Express:
    
    // Verificação do webhook (GET)
    // app.get('/webhook/whatsapp', (req, res) => {
    //   const mode = req.query['hub.mode'];
    //   const token = req.query['hub.verify_token'];
    //   const challenge = req.query['hub.challenge'];
    //   
    //   const verification = whatsappService.verifyWebhook(mode, token, challenge);
    //   
    //   if (verification.success) {
    //     res.status(200).send(verification.challenge);
    //   } else {
    //     res.sendStatus(403);
    //   }
    // });
    
    // Recebimento de mensagens (POST)
    // app.post('/webhook/whatsapp', async (req, res) => {
    //   const data = req.body;
    //   
    //   // Confirma recebimento imediatamente
    //   res.status(200).send('OK');
    //   
    //   // Processa a mensagem de forma assíncrona
    //   this.processIncomingMessage(data)
    //     .then(result => console.log('Mensagem processada:', result))
    //     .catch(error => console.error('Erro ao processar mensagem:', error));
    // });
    
    console.log('Webhook configurado para WhatsApp');
  }
}

export default new CoraWhatsAppIntegration();
