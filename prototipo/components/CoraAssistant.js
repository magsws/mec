import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS, FONT, SIZES, SHADOWS } from '../assets/theme';
import coraService from '../services/cora/coraService';
import coraKnowledgeManager from '../services/cora/coraKnowledgeManager';

/**
 * Componente da Assistente Virtual Cora (Versão Atualizada)
 * Implementa uma interface de chat flutuante que pode ser acessada de qualquer tela
 * Integrado com o serviço da Cora para processamento de mensagens
 */
const CoraAssistant = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inicializa a conversa quando o componente é montado
  useEffect(() => {
    // Inicializa a base de conhecimento com documentos de exemplo
    coraKnowledgeManager.addSampleDocuments();
    
    // Inicializa a conversa
    const convId = coraService.initConversation(`user_${Date.now()}`);
    setConversationId(convId);
    
    // Adiciona mensagem de boas-vindas
    setChatHistory([
      { 
        id: '1', 
        sender: 'cora', 
        text: 'Olá! Eu sou a Cora, sua assistente virtual do MundoemCores.com. Como posso ajudar você hoje?' 
      },
    ]);
  }, []);

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (message.trim() === '') return;
    
    // Adiciona mensagem do usuário ao histórico
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
    };
    
    setChatHistory(prevChat => [...prevChat, userMessage]);
    const userMessageText = message;
    setMessage('');
    setLoading(true);
    
    try {
      // Processa a mensagem através do serviço da Cora
      const response = await coraService.processMessage(conversationId, userMessageText);
      
      // Adiciona resposta da Cora ao histórico
      const coraResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'cora',
        text: response,
      };
      
      setChatHistory(prevChat => [...prevChat, coraResponse]);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adiciona mensagem de erro ao histórico
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'cora',
        text: 'Desculpe, estou com dificuldades para processar sua mensagem no momento. Por favor, tente novamente mais tarde.',
      };
      
      setChatHistory(prevChat => [...prevChat, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Limpa o histórico de conversa
  const clearChat = () => {
    if (conversationId) {
      coraService.clearConversation(conversationId);
      setChatHistory([
        { 
          id: Date.now().toString(), 
          sender: 'cora', 
          text: 'Conversa reiniciada. Como posso ajudar você hoje?' 
        },
      ]);
    }
  };

  // Renderiza cada mensagem do chat
  const renderChatMessage = ({ item }) => (
    <View 
      style={[
        styles.messageBubble, 
        item.sender === 'user' ? styles.userMessage : styles.coraMessage
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botão flutuante da Cora */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.floatingButtonText}>Cora</Text>
      </TouchableOpacity>

      {/* Modal do chat */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.chatContainer}>
            {/* Cabeçalho do chat */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Assistente Cora</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearChat}
                >
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Histórico de mensagens */}
            <FlatList
              data={chatHistory}
              renderItem={renderChatMessage}
              keyExtractor={item => item.id}
              style={styles.chatHistory}
              inverted={false}
              contentContainerStyle={styles.chatHistoryContent}
            />
            
            {/* Indicador de digitação */}
            {loading && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Cora está digitando</Text>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
            
            {/* Área de input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.inputContainer}
            >
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={COLORS.darkGray}
                multiline={true}
                maxLength={500}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={loading || message.trim() === ''}
              >
                <Text style={styles.sendButtonText}>Enviar</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  floatingButtonText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.primary,
  },
  chatHeaderTitle: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 15,
  },
  clearButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
  },
  chatHistory: {
    flex: 1,
    padding: 10,
  },
  chatHistoryContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.lightGray,
    borderBottomRightRadius: 5,
  },
  coraMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.tertiary,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.dark,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginLeft: 10,
  },
  typingText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
});

export default CoraAssistant;
