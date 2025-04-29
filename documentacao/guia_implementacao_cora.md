# Guia de Implementação da Assistente Virtual Cora

## Visão Geral

Este documento fornece instruções detalhadas para implementar a assistente virtual Cora no aplicativo MundoemCores.com. A Cora é uma assistente especializada em desenvolvimento infantil e educação, que pode ser acessada tanto pelo aplicativo quanto pelo WhatsApp.

## Pré-requisitos

1. Conta na OpenAI com acesso à API GPT-4 ou similar
2. Conhecimento básico de processamento de linguagem natural
3. Ambiente de desenvolvimento React Native configurado
4. Firebase para armazenamento de conversas e dados de usuário

## Configuração da API OpenAI

### 1. Criar Conta e Obter Chave de API

1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Navegue até "API Keys"
4. Clique em "Create new secret key"
5. Copie e armazene a chave de forma segura

### 2. Configurar Limites e Orçamento

1. Acesse "Usage Limits" no painel da OpenAI
2. Configure limites de gastos mensais
3. Configure alertas de uso

## Implementação da Assistente Cora

### 1. Instalação de Dependências

```bash
npm install openai axios @react-native-firebase/firestore
# ou
yarn add openai axios @react-native-firebase/firestore
```

### 2. Serviço da Assistente Cora

Crie um arquivo `coraService.js` na pasta `services/cora`:

```javascript
import { Configuration, OpenAIApi } from 'openai';
import firestore from '@react-native-firebase/firestore';
import { getKnowledgeForQuery } from './coraKnowledgeManager';

// Configuração da API OpenAI
const OPENAI_API_KEY = 'SUA_CHAVE_API_OPENAI'; // Substitua pela chave real

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Prompt inicial que define a personalidade e conhecimentos da Cora
const SYSTEM_PROMPT = `
Você é Cora, a assistente virtual especializada em desenvolvimento infantil e educação do aplicativo MundoemCores.com.

Sua personalidade:
- Amigável, acolhedora e empática
- Paciente e compreensiva com as dúvidas dos pais
- Informativa, mas sem usar jargão técnico desnecessário
- Sempre baseada em evidências científicas
- Respeitosa com diferentes estilos parentais

Seus conhecimentos incluem:
- Método Montessori
- Disciplina Positiva
- Desenvolvimento Cerebral da Criança
- Comportamento Infantil
- Temperamentos
- Relacionamento Conjugal no contexto familiar
- Comunicação Não-Violenta
- Educação Positiva

Quando não souber responder algo, admita e sugira que o usuário entre em contato com o suporte pelo email contato@mundoemcores.com.

Mantenha suas respostas concisas (máximo de 3 parágrafos) e sempre ofereça sugestões práticas quando apropriado.
`;

/**
 * Gera uma resposta da Cora com base na mensagem do usuário
 * @param {string} message - Mensagem do usuário
 * @param {string} userId - ID do usuário
 * @param {string} conversationId - ID da conversa
 * @returns {Promise<string>} - Resposta da Cora
 */
const generateCoraResponse = async (message, userId, conversationId) => {
  try {
    // Buscar histórico de conversa
    const conversationHistory = await getConversationHistory(userId, conversationId);
    
    // Buscar conhecimento relevante para a pergunta
    const relevantKnowledge = await getKnowledgeForQuery(message);
    
    // Construir prompt com conhecimento relevante
    let contextPrompt = '';
    if (relevantKnowledge && relevantKnowledge.length > 0) {
      contextPrompt = `
Informações relevantes para responder à pergunta:
${relevantKnowledge.join('\n\n')}

Use as informações acima para responder à pergunta do usuário, mas não mencione explicitamente que está usando essas informações.
`;
    }
    
    // Construir mensagens para a API
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    
    // Adicionar contexto se existir
    if (contextPrompt) {
      messages.push({ role: 'system', content: contextPrompt });
    }
    
    // Adicionar histórico de conversa
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });
    
    // Adicionar mensagem atual do usuário
    messages.push({ role: 'user', content: message });
    
    // Chamar a API da OpenAI
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // ou outro modelo disponível
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });
    
    // Extrair resposta
    const coraResponse = response.data.choices[0].message.content.trim();
    
    // Salvar mensagem no histórico
    await saveMessageToHistory(userId, conversationId, 'user', message);
    await saveMessageToHistory(userId, conversationId, 'cora', coraResponse);
    
    return coraResponse;
  } catch (error) {
    console.error('Erro ao gerar resposta da Cora:', error);
    
    // Resposta de fallback em caso de erro
    return 'Desculpe, estou com dificuldades para processar sua pergunta no momento. Por favor, tente novamente em alguns instantes ou entre em contato com nosso suporte pelo email contato@mundoemcores.com.';
  }
};

/**
 * Busca o histórico de conversa do usuário
 * @param {string} userId - ID do usuário
 * @param {string} conversationId - ID da conversa
 * @returns {Promise<Array>} - Histórico de mensagens
 */
const getConversationHistory = async (userId, conversationId) => {
  try {
    const messagesSnapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(20) // Limitar para as últimas 20 mensagens
      .get();
    
    return messagesSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Erro ao buscar histórico de conversa:', error);
    return [];
  }
};

/**
 * Salva uma mensagem no histórico de conversa
 * @param {string} userId - ID do usuário
 * @param {string} conversationId - ID da conversa
 * @param {string} sender - Remetente ('user' ou 'cora')
 * @param {string} text - Texto da mensagem
 * @returns {Promise<void>}
 */
const saveMessageToHistory = async (userId, conversationId, sender, text) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .add({
        sender,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    
    // Atualizar metadados da conversa
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .set({
        lastMessage: text,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        lastMessageSender: sender,
      }, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
};

/**
 * Cria uma nova conversa para o usuário
 * @param {string} userId - ID do usuário
 * @param {string} title - Título da conversa (opcional)
 * @returns {Promise<string>} - ID da nova conversa
 */
const createNewConversation = async (userId, title = 'Nova conversa') => {
  try {
    const conversationRef = await firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .add({
        title,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
      });
    
    return conversationRef.id;
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
};

/**
 * Busca todas as conversas do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} - Lista de conversas
 */
const getUserConversations = async (userId) => {
  try {
    const conversationsSnapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .orderBy('lastMessageTime', 'desc')
      .get();
    
    return conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return [];
  }
};

export default {
  generateCoraResponse,
  getConversationHistory,
  createNewConversation,
  getUserConversations,
};
```

### 3. Gerenciador de Conhecimento da Cora

Crie um arquivo `coraKnowledgeManager.js` na pasta `services/cora`:

```javascript
import firestore from '@react-native-firebase/firestore';

/**
 * Busca conhecimento relevante para uma consulta
 * @param {string} query - Consulta do usuário
 * @returns {Promise<Array>} - Lista de trechos de conhecimento relevantes
 */
const getKnowledgeForQuery = async (query) => {
  try {
    // Simplificar a consulta para busca
    const searchTerms = simplifyQuery(query);
    
    // Buscar documentos de conhecimento relevantes
    const knowledgeSnapshot = await firestore()
      .collection('coraKnowledge')
      .where('tags', 'array-contains-any', searchTerms)
      .limit(5)
      .get();
    
    // Se não encontrar nada, tentar busca mais ampla
    if (knowledgeSnapshot.empty) {
      // Buscar os documentos mais populares ou gerais
      const fallbackSnapshot = await firestore()
        .collection('coraKnowledge')
        .where('isGeneral', '==', true)
        .limit(3)
        .get();
      
      return fallbackSnapshot.docs.map(doc => doc.data().content);
    }
    
    // Extrair conteúdo dos documentos
    return knowledgeSnapshot.docs.map(doc => doc.data().content);
  } catch (error) {
    console.error('Erro ao buscar conhecimento:', error);
    return [];
  }
};

/**
 * Simplifica a consulta para extrair termos de busca
 * @param {string} query - Consulta original
 * @returns {Array} - Lista de termos de busca
 */
const simplifyQuery = (query) => {
  // Converter para minúsculas
  const lowercaseQuery = query.toLowerCase();
  
  // Remover pontuação e caracteres especiais
  const cleanQuery = lowercaseQuery.replace(/[^\w\s]/g, '');
  
  // Dividir em palavras
  const words = cleanQuery.split(/\s+/);
  
  // Remover stopwords (palavras comuns que não ajudam na busca)
  const stopwords = ['e', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'em', 'com', 'por', 'para', 'pelo', 'pela', 'que', 'se', 'como', 'quando', 'onde', 'porque', 'por que', 'qual', 'quais', 'quem'];
  const filteredWords = words.filter(word => !stopwords.includes(word) && word.length > 2);
  
  // Identificar termos específicos de domínio
  const domainTerms = identifyDomainTerms(filteredWords);
  
  // Combinar termos de domínio com palavras filtradas
  return [...new Set([...domainTerms, ...filteredWords])].slice(0, 10);
};

/**
 * Identifica termos específicos do domínio de educação infantil
 * @param {Array} words - Lista de palavras
 * @returns {Array} - Lista de termos de domínio identificados
 */
const identifyDomainTerms = (words) => {
  const domainDictionary = {
    'montessori': ['montessori', 'montessoriano', 'montessoriana'],
    'disciplina_positiva': ['disciplina', 'positiva', 'limites', 'regras'],
    'desenvolvimento_cerebral': ['cerebro', 'neural', 'neurociencia', 'desenvolvimento'],
    'comportamento': ['comportamento', 'birra', 'birras', 'choro', 'agressividade'],
    'temperamento': ['temperamento', 'personalidade', 'perfil'],
    'relacionamento': ['casal', 'conjugal', 'relacionamento', 'pais'],
    'comunicacao': ['comunicacao', 'dialogo', 'conversar', 'falar'],
  };
  
  const identifiedTerms = [];
  
  // Verificar cada palavra contra o dicionário de domínio
  words.forEach(word => {
    for (const [domain, terms] of Object.entries(domainDictionary)) {
      if (terms.some(term => word.includes(term) || term.includes(word))) {
        identifiedTerms.push(domain);
        break;
      }
    }
  });
  
  return identifiedTerms;
};

/**
 * Adiciona um novo documento de conhecimento
 * @param {string} content - Conteúdo do conhecimento
 * @param {Array} tags - Tags para categorização
 * @param {string} source - Fonte do conhecimento
 * @param {boolean} isGeneral - Se é um conhecimento geral
 * @returns {Promise<string>} - ID do documento criado
 */
const addKnowledgeDocument = async (content, tags, source, isGeneral = false) => {
  try {
    const docRef = await firestore()
      .collection('coraKnowledge')
      .add({
        content,
        tags,
        source,
        isGeneral,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar documento de conhecimento:', error);
    throw error;
  }
};

/**
 * Busca documentos de conhecimento por tags
 * @param {Array} tags - Tags para busca
 * @returns {Promise<Array>} - Lista de documentos
 */
const getKnowledgeByTags = async (tags) => {
  try {
    const knowledgeSnapshot = await firestore()
      .collection('coraKnowledge')
      .where('tags', 'array-contains-any', tags)
      .get();
    
    return knowledgeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao buscar conhecimento por tags:', error);
    return [];
  }
};

export {
  getKnowledgeForQuery,
  addKnowledgeDocument,
  getKnowledgeByTags,
};
```

### 4. Componente da Interface da Cora

Crie um arquivo `CoraAssistant.js` na pasta `components`:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext'; // Ajuste conforme sua implementação
import coraService from '../services/cora/coraService';

const CoraAssistant = ({ isVisible, onClose, conversationId: propConversationId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(propConversationId);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : 300)).current;
  
  // Efeito para animação de entrada/saída
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : 300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);
  
  // Carregar histórico de conversa quando o componente montar ou conversationId mudar
  useEffect(() => {
    const loadConversation = async () => {
      if (!user || !conversationId) return;
      
      try {
        setLoading(true);
        const history = await coraService.getConversationHistory(user.uid, conversationId);
        setMessages(history);
      } catch (error) {
        console.error('Erro ao carregar conversa:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (conversationId) {
      loadConversation();
    } else if (user) {
      // Criar nova conversa se não existir
      createNewConversation();
    }
  }, [user, conversationId]);
  
  // Criar nova conversa
  const createNewConversation = async () => {
    if (!user) return;
    
    try {
      const newConversationId = await coraService.createNewConversation(user.uid);
      setConversationId(newConversationId);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };
  
  // Enviar mensagem
  const sendMessage = async () => {
    if (!message.trim() || !user || !conversationId) return;
    
    const userMessage = message.trim();
    setMessage('');
    
    // Adicionar mensagem do usuário à lista
    const newUserMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Mostrar indicador de digitação
    setIsTyping(true);
    
    try {
      // Gerar resposta da Cora
      const coraResponse = await coraService.generateCoraResponse(
        userMessage,
        user.uid,
        conversationId
      );
      
      // Adicionar resposta da Cora à lista
      const newCoraMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'cora',
        text: coraResponse,
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, newCoraMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Adicionar mensagem de erro
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'cora',
        text: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Renderizar item de mensagem
  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.coraBubble,
        item.isError && styles.errorBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.coraText,
          item.isError && styles.errorText
        ]}>
          {item.text}
        </Text>
      </View>
    );
  };
  
  // Limpar conversa
  const clearConversation = async () => {
    if (!user) return;
    
    try {
      await createNewConversation();
    } catch (error) {
      console.error('Erro ao limpar conversa:', error);
    }
  };
  
  // Se não estiver visível, não renderizar nada
  if (!isVisible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cora</Text>
          <Text style={styles.headerSubtitle}>Sua assistente virtual</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Lista de mensagens */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b72f2f" />
          <Text style={styles.loadingText}>Carregando conversa...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      
      {/* Indicador de digitação */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>Cora está digitando</Text>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      )}
      
      {/* Área de entrada de mensagem */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.disabledButton]} 
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Icon name="send" size={24} color={message.trim() ? '#fff' : '#aaa'} />
          </TouchableOpacity>
        </View>
        
        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={clearConversation}>
            <Icon name="refresh" size={20} color="#666" />
            <Text style={styles.actionButtonText}>Nova conversa</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#23364e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ddd',
  },
  closeButton: {
    padding: 5,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#e6f7ff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  coraBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  errorBubble: {
    backgroundColor: '#ffebee',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#23364e',
  },
  coraText: {
    color: '#333',
  },
  errorText: {
    color: '#b71c1c',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 15,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b72f2f',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#b72f2f',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default CoraAssistant;
```

### 5. Botão Flutuante da Cora

Crie um arquivo `CoraFloatingButton.js` na pasta `components`:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CoraAssistant from './CoraAssistant';

const CoraFloatingButton = () => {
  const [isAssistantVisible, setAssistantVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  
  // Efeito para mostrar tooltip na primeira vez
  useEffect(() => {
    // Verificar se é a primeira vez que o usuário vê o botão
    const checkFirstTime = async () => {
      try {
        // Aqui você pode implementar uma verificação com AsyncStorage
        // para determinar se é a primeira vez que o usuário vê o botão
        const isFirstTime = true; // Substitua por sua lógica
        
        if (isFirstTime) {
          // Mostrar tooltip após 2 segundos
          setTimeout(() => {
            showTooltipAnimation();
          }, 2000);
          
          // Esconder tooltip após 5 segundos
          setTimeout(() => {
            hideTooltipAnimation();
          }, 7000);
        }
      } catch (error) {
        console.error('Erro ao verificar primeira vez:', error);
      }
    };
    
    checkFirstTime();
  }, []);
  
  // Animação de pulso
  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
    
    // Repetir a animação a cada 5 segundos
    const interval = setInterval(() => {
      if (!isAssistantVisible) {
        pulseAnimation.start();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [scaleAnim, isAssistantVisible]);
  
  // Mostrar tooltip
  const showTooltipAnimation = () => {
    setShowTooltip(true);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Esconder tooltip
  const hideTooltipAnimation = () => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  };
  
  // Abrir assistente
  const openAssistant = () => {
    hideTooltipAnimation();
    setAssistantVisible(true);
  };
  
  // Fechar assistente
  const closeAssistant = () => {
    setAssistantVisible(false);
  };
  
  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={openAssistant}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Icon name="chat" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
      
      {showTooltip && (
        <Animated.View 
          style={[
            styles.tooltip,
            { opacity: tooltipOpacity }
          ]}
        >
          <Text style={styles.tooltipText}>
            Olá! Sou a Cora, sua assistente virtual. Clique aqui para conversar comigo!
          </Text>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      
      <CoraAssistant 
        isVisible={isAssistantVisible} 
        onClose={closeAssistant} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b72f2f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  tooltip: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 99,
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -10,
    right: 30,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
});

export default CoraFloatingButton;
```

### 6. Integração no App Principal

Adicione o botão flutuante da Cora ao componente principal do aplicativo:

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';
import CoraFloatingButton from './components/CoraFloatingButton';

// Importar telas
import HomeScreen from './screens/HomeScreen';
import CoursesScreen from './screens/CoursesScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';
// ... outras importações

const Stack = createStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MundoemCores' }} />
          <Stack.Screen name="Courses" component={CoursesScreen} options={{ title: 'Cursos' }} />
          <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={({ route }) => ({ title: route.params.title })} />
          <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false }} />
          {/* ... outras telas */}
        </Stack.Navigator>
        
        {/* Botão flutuante da Cora */}
        <CoraFloatingButton />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
```

## Preparação da Base de Conhecimento

### 1. Estrutura de Dados no Firestore

Crie a seguinte estrutura no Firestore:

```
coraKnowledge/
├── [documentId]/
│   ├── content: "Texto com informação sobre o tema"
│   ├── tags: ["montessori", "desenvolvimento", "criança"]
│   ├── source: "Center of Developing Child - Harvard"
│   ├── isGeneral: false
│   └── createdAt: Timestamp
└── ...
```

### 2. Script para Importação de Conhecimento

Crie um script para importar conhecimento para a base de dados:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Função para importar conhecimento de um arquivo
const importKnowledgeFromFile = async (filePath, tags, source, isGeneral = false) => {
  try {
    // Ler arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Dividir em parágrafos ou seções
    const sections = content.split('\n\n').filter(section => section.trim().length > 0);
    
    // Importar cada seção como um documento separado
    for (const section of sections) {
      await db.collection('coraKnowledge').add({
        content: section.trim(),
        tags,
        source,
        isGeneral,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Documento importado: ${section.substring(0, 50)}...`);
    }
    
    console.log(`Importação concluída para ${filePath}`);
  } catch (error) {
    console.error(`Erro ao importar ${filePath}:`, error);
  }
};

// Exemplo de uso
const importAllKnowledge = async () => {
  // Montessori
  await importKnowledgeFromFile(
    './knowledge/montessori_principles.txt',
    ['montessori', 'metodologia', 'educacao'],
    'Princípios Montessori - Isa Minatel'
  );
  
  // Disciplina Positiva
  await importKnowledgeFromFile(
    './knowledge/positive_discipline.txt',
    ['disciplina_positiva', 'limites', 'comportamento'],
    'Disciplina Positiva - Elisama Santos'
  );
  
  // Desenvolvimento Cerebral
  await importKnowledgeFromFile(
    './knowledge/brain_development.txt',
    ['desenvolvimento_cerebral', 'neurociencia', 'aprendizagem'],
    'Center of Developing Child - Harvard'
  );
  
  // Conhecimentos gerais
  await importKnowledgeFromFile(
    './knowledge/general_parenting.txt',
    ['geral', 'pais', 'educacao'],
    'MundoemCores.com',
    true
  );
  
  console.log('Importação de todos os documentos concluída!');
};

importAllKnowledge();
```

## Considerações de Desempenho e Custo

### 1. Otimização de Chamadas à API

- Implemente cache de respostas para perguntas frequentes
- Limite o número de tokens na resposta (max_tokens)
- Monitore o uso da API para evitar custos excessivos

### 2. Gerenciamento de Conversas

- Limite o histórico de conversa enviado à API (últimas 10-20 mensagens)
- Implemente limpeza automática de conversas antigas
- Armazene resumos de conversas para referência futura

### 3. Privacidade e Segurança

- Não armazene informações pessoais sensíveis
- Implemente criptografia para dados armazenados
- Obtenha consentimento explícito dos usuários para processamento de dados

## Integração com WhatsApp

Para integrar a Cora com o WhatsApp, consulte o documento separado "Guia de Integração WhatsApp" que detalha o processo de configuração da API do WhatsApp Business e implementação da integração.

## Testes e Validação

### 1. Testes Unitários

Implemente testes unitários para:
- Processamento de consultas
- Geração de respostas
- Gerenciamento de conversas

### 2. Testes de Integração

Teste a integração com:
- API da OpenAI
- Firebase Firestore
- Componentes de UI

### 3. Testes de Usuário

Realize testes com usuários reais para:
- Avaliar a qualidade das respostas
- Verificar a usabilidade da interface
- Identificar áreas para melhoria

## Recursos Adicionais

- [Documentação da API OpenAI](https://platform.openai.com/docs/api-reference)
- [Guia de Melhores Práticas OpenAI](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Documentação do Firebase](https://firebase.google.com/docs)
- [Guia de React Native](https://reactnative.dev/docs/getting-started)

## Suporte

Para questões relacionadas à implementação da assistente Cora, entre em contato com:
- Email: contato@mundoemcores.com
