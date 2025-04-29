# Guia de Implementação do Modelo Freemium

## Visão Geral

Este documento fornece instruções detalhadas para implementar o modelo freemium no aplicativo MundoemCores.com. O modelo permitirá que os usuários se cadastrem gratuitamente e tenham acesso a conteúdos limitados, enquanto o acesso completo será disponibilizado mediante assinatura.

## Requisitos do Modelo Freemium

O modelo freemium do MundoemCores.com inclui:

1. **Acesso gratuito a**:
   - Primeira aula de cada curso
   - Conteúdos específicos marcados como gratuitos
   - Funcionalidades básicas da assistente virtual Cora

2. **Acesso premium (pago) a**:
   - Todos os cursos completos
   - Todas as playlists e e-books
   - Funcionalidades avançadas da assistente Cora
   - Integração com WhatsApp

## Implementação no Firebase

### 1. Estrutura de Dados

Configure a seguinte estrutura no Firestore:

```
users/
├── [userId]/
│   ├── email: "usuario@exemplo.com"
│   ├── displayName: "Nome do Usuário"
│   ├── createdAt: Timestamp
│   ├── subscription: {
│   │   ├── status: "free" | "premium"
│   │   ├── plan: "mensal" | "anual" | null
│   │   ├── startDate: Timestamp | null
│   │   ├── endDate: Timestamp | null
│   │   ├── autoRenew: boolean
│   │   ├── paymentMethod: "hotmart" | null
│   │   └── paymentId: "ID_TRANSACAO_HOTMART" | null
│   └── ...

courses/
├── [courseId]/
│   ├── title: "Título do Curso"
│   ├── description: "Descrição do curso"
│   ├── isFree: false
│   ├── lessons/
│   │   ├── [lessonId]/
│   │   │   ├── title: "Título da Aula"
│   │   │   ├── order: 1
│   │   │   ├── isFree: true | false
│   │   │   └── ...
│   │   └── ...
│   └── ...
```

### 2. Regras de Segurança do Firestore

Configure as seguintes regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função para verificar se o usuário tem assinatura premium ativa
    function hasPremiumAccess() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscription.status == "premium" &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscription.endDate > request.time;
    }
    
    // Função para verificar se a lição é gratuita ou é a primeira do curso
    function isLessonFreeOrFirst(courseId, lessonId) {
      let lesson = get(/databases/$(database)/documents/courses/$(courseId)/lessons/$(lessonId)).data;
      return lesson.isFree == true || lesson.order == 1;
    }
    
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cursos são públicos para leitura
    match /courses/{courseId} {
      allow read: if true;
      
      // Lições têm acesso controlado
      match /lessons/{lessonId} {
        allow read: if isLessonFreeOrFirst(courseId, lessonId) || hasPremiumAccess();
      }
    }
    
    // Playlists têm acesso controlado
    match /playlists/{playlistId} {
      allow read: if resource.data.isFree == true || hasPremiumAccess();
    }
    
    // E-books têm acesso controlado
    match /ebooks/{ebookId} {
      allow read: if resource.data.isFree == true || hasPremiumAccess();
    }
  }
}
```

## Implementação no Frontend

### 1. Componente de Verificação de Acesso

Crie um arquivo `useSubscription.js` na pasta `hooks`:

```javascript
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para verificar o status da assinatura do usuário
 * @returns {Object} Informações da assinatura e funções de verificação
 */
const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Carregar dados da assinatura
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setSubscription(doc.data().subscription || { status: 'free' });
          } else {
            setSubscription({ status: 'free' });
          }
          setLoading(false);
        },
        (err) => {
          console.error('Erro ao carregar assinatura:', err);
          setError(err);
          setLoading(false);
        }
      );
    
    return () => unsubscribe();
  }, [user]);
  
  /**
   * Verifica se o usuário tem acesso premium
   * @returns {boolean} Se o usuário tem acesso premium
   */
  const hasPremiumAccess = () => {
    if (!subscription) return false;
    
    return (
      subscription.status === 'premium' &&
      subscription.endDate &&
      subscription.endDate.toDate() > new Date()
    );
  };
  
  /**
   * Verifica se o usuário tem acesso a um conteúdo específico
   * @param {Object} content Objeto com informações do conteúdo
   * @returns {boolean} Se o usuário tem acesso ao conteúdo
   */
  const hasAccessToContent = (content) => {
    // Se o conteúdo é gratuito, todos têm acesso
    if (content.isFree) return true;
    
    // Se é uma lição e é a primeira do curso, todos têm acesso
    if (content.type === 'lesson' && content.order === 1) return true;
    
    // Caso contrário, apenas usuários premium têm acesso
    return hasPremiumAccess();
  };
  
  return {
    subscription,
    loading,
    error,
    hasPremiumAccess,
    hasAccessToContent,
    isPremium: subscription?.status === 'premium',
    isFree: subscription?.status === 'free' || !subscription,
  };
};

export default useSubscription;
```

### 2. Componente de Paywall

Crie um arquivo `PaywallScreen.js` na pasta `screens`:

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const PaywallScreen = ({ route }) => {
  const navigation = useNavigation();
  const { contentTitle, contentType, returnScreen, returnParams } = route.params || {};
  
  // Abrir página de assinatura no Hotmart
  const openSubscriptionPage = () => {
    // URL da página de assinatura no Hotmart
    const hotmartUrl = 'https://hotmart.com/pt-br/marketplace/produtos/mundoemcores';
    
    Linking.openURL(hotmartUrl);
  };
  
  // Voltar para a tela anterior
  const goBack = () => {
    if (returnScreen) {
      navigation.navigate(returnScreen, returnParams || {});
    } else {
      navigation.goBack();
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="lock" size={60} color="#b72f2f" />
        <Text style={styles.title}>Conteúdo Premium</Text>
        {contentTitle && (
          <Text style={styles.contentTitle}>
            {contentType === 'course' ? 'Curso: ' : contentType === 'ebook' ? 'E-book: ' : ''}
            {contentTitle}
          </Text>
        )}
      </View>
      
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          Este conteúdo está disponível apenas para assinantes premium do MundoemCores.com.
        </Text>
      </View>
      
      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Com a assinatura premium você tem acesso a:</Text>
        
        <View style={styles.benefitItem}>
          <Icon name="check-circle" size={24} color="#367c53" />
          <Text style={styles.benefitText}>Todos os cursos completos</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Icon name="check-circle" size={24} color="#367c53" />
          <Text style={styles.benefitText}>Todas as playlists e e-books</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Icon name="check-circle" size={24} color="#367c53" />
          <Text style={styles.benefitText}>Funcionalidades avançadas da assistente Cora</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Icon name="check-circle" size={24} color="#367c53" />
          <Text style={styles.benefitText}>Integração com WhatsApp</Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Icon name="check-circle" size={24} color="#367c53" />
          <Text style={styles.benefitText}>Mais de 80 horas de conteúdo sobre educação infantil</Text>
        </View>
      </View>
      
      <View style={styles.plansContainer}>
        <Text style={styles.plansTitle}>Escolha seu plano:</Text>
        
        <TouchableOpacity style={styles.planCard} onPress={openSubscriptionPage}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Mensal</Text>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPriceCurrency}>R$</Text>
              <Text style={styles.planPrice}>39</Text>
              <Text style={styles.planPriceCents}>,90</Text>
            </View>
            <Text style={styles.planPriceDescription}>por mês</Text>
          </View>
          <View style={styles.planFeatures}>
            <Text style={styles.planFeatureText}>Acesso a todo conteúdo</Text>
            <Text style={styles.planFeatureText}>Cancele quando quiser</Text>
          </View>
          <View style={styles.planButton}>
            <Text style={styles.planButtonText}>ASSINAR AGORA</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.planCard, styles.recommendedPlan]} onPress={openSubscriptionPage}>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>RECOMENDADO</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Anual</Text>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPriceCurrency}>R$</Text>
              <Text style={styles.planPrice}>297</Text>
              <Text style={styles.planPriceCents}>,00</Text>
            </View>
            <Text style={styles.planPriceDescription}>por ano (R$ 24,75/mês)</Text>
          </View>
          <View style={styles.planFeatures}>
            <Text style={styles.planFeatureText}>Economize 38% em relação ao mensal</Text>
            <Text style={styles.planFeatureText}>Acesso a todo conteúdo</Text>
          </View>
          <View style={[styles.planButton, styles.recommendedButton]}>
            <Text style={styles.planButtonText}>ASSINAR AGORA</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-back" size={20} color="#666" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      
      <View style={styles.secureContainer}>
        <Icon name="security" size={20} color="#666" />
        <Text style={styles.secureText}>Pagamento seguro via Hotmart</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#23364e',
    marginTop: 15,
    textAlign: 'center',
  },
  contentTitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  messageContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
  },
  benefitsContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 15,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  plansContainer: {
    padding: 20,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendedPlan: {
    borderColor: '#9cac3b',
    borderWidth: 2,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#9cac3b',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recommendedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 10,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planPriceCurrency: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b72f2f',
    marginTop: 5,
  },
  planPrice: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#b72f2f',
  },
  planPriceCents: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b72f2f',
    marginTop: 5,
  },
  planPriceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeatureText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  planButton: {
    backgroundColor: '#b72f2f',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  recommendedButton: {
    backgroundColor: '#367c53',
  },
  planButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 5,
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  secureText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default PaywallScreen;
```

### 3. Componente de Conteúdo Bloqueado

Crie um arquivo `LockedContentCard.js` na pasta `components`:

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useSubscription from '../hooks/useSubscription';

const LockedContentCard = ({ content, type = 'course', onPress }) => {
  const navigation = useNavigation();
  const { hasAccessToContent } = useSubscription();
  
  const hasAccess = hasAccessToContent(content);
  
  const handlePress = () => {
    if (hasAccess) {
      // Se tem acesso, executa a ação normal
      if (onPress) onPress();
    } else {
      // Se não tem acesso, redireciona para o paywall
      navigation.navigate('Paywall', {
        contentTitle: content.title,
        contentType: type,
        returnScreen: navigation.getCurrentRoute().name,
        returnParams: navigation.getCurrentRoute().params
      });
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: content.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
        {!hasAccess && (
          <View style={styles.lockOverlay}>
            <Icon name="lock" size={30} color="#fff" />
          </View>
        )}
        {content.isFree && (
          <View style={styles.freeTag}>
            <Text style={styles.freeTagText}>GRÁTIS</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {content.title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {content.description}
        </Text>
        
        <View style={styles.metaContainer}>
          {type === 'course' && (
            <View style={styles.metaItem}>
              <Icon name="play-circle-filled" size={16} color="#666" />
              <Text style={styles.metaText}>
                {content.lessonCount || 0} aulas
              </Text>
            </View>
          )}
          
          {type === 'ebook' && (
            <View style={styles.metaItem}>
              <Icon name="book" size={16} color="#666" />
              <Text style={styles.metaText}>
                {content.pageCount || 0} páginas
              </Text>
            </View>
          )}
          
          {content.duration && (
            <View style={styles.metaItem}>
              <Icon name="access-time" size={16} color="#666" />
              <Text style={styles.metaText}>
                {typeof content.duration === 'number'
                  ? `${Math.floor(content.duration / 60)}min`
                  : content.duration}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            hasAccess ? styles.accessButton : styles.lockedButton
          ]}
          onPress={handlePress}
        >
          <Text style={styles.actionButtonText}>
            {hasAccess ? 'ACESSAR' : 'PREMIUM'}
          </Text>
          <Icon
            name={hasAccess ? 'arrow-forward' : 'lock'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#9cac3b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  freeTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentContainer: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 5,
  },
  accessButton: {
    backgroundColor: '#367c53',
  },
  lockedButton: {
    backgroundColor: '#b72f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default LockedContentCard;
```

### 4. Componente de Aula Bloqueada

Crie um arquivo `LockedLessonItem.js` na pasta `components`:

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useSubscription from '../hooks/useSubscription';

const LockedLessonItem = ({ lesson, courseId, courseTitle, onPress }) => {
  const navigation = useNavigation();
  const { hasAccessToContent } = useSubscription();
  
  // Adicionar tipo e ordem para verificação de acesso
  const lessonWithType = {
    ...lesson,
    type: 'lesson',
  };
  
  const hasAccess = hasAccessToContent(lessonWithType);
  
  const handlePress = () => {
    if (hasAccess) {
      // Se tem acesso, executa a ação normal
      if (onPress) onPress();
    } else {
      // Se não tem acesso, redireciona para o paywall
      navigation.navigate('Paywall', {
        contentTitle: courseTitle,
        contentType: 'course',
        returnScreen: 'CourseDetail',
        returnParams: { courseId }
      });
    }
  };
  
  // Formatar duração
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !hasAccess && styles.lockedContainer
      ]}
      onPress={handlePress}
    >
      <View style={styles.leftContainer}>
        <View style={[
          styles.numberContainer,
          !hasAccess && styles.lockedNumberContainer
        ]}>
          <Text style={styles.numberText}>{lesson.order}</Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[
          styles.title,
          !hasAccess && styles.lockedTitle
        ]}>
          {lesson.title}
        </Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Icon name="access-time" size={14} color={hasAccess ? '#666' : '#999'} />
            <Text style={[
              styles.metaText,
              !hasAccess && styles.lockedMetaText
            ]}>
              {formatDuration(lesson.duration || 0)}
            </Text>
          </View>
          
          {lesson.isFree && (
            <View style={styles.freeTag}>
              <Text style={styles.freeTagText}>GRÁTIS</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.rightContainer}>
        {hasAccess ? (
          <Icon name="play-circle-filled" size={24} color="#367c53" />
        ) : (
          <Icon name="lock" size={24} color="#b72f2f" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  lockedContainer: {
    backgroundColor: '#f9f9f9',
  },
  leftContainer: {
    marginRight: 15,
  },
  numberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#367c53',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedNumberContainer: {
    backgroundColor: '#ccc',
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#23364e',
    marginBottom: 5,
  },
  lockedTitle: {
    color: '#999',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  lockedMetaText: {
    color: '#999',
  },
  freeTag: {
    backgroundColor: '#9cac3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freeTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
});

export default LockedLessonItem;
```

### 5. Tela de Perfil com Informações de Assinatura

Atualize o arquivo `ProfileScreen.js` na pasta `screens`:

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import useSubscription from '../hooks/useSubscription';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { subscription, loading, isPremium } = useSubscription();
  
  // Formatar data
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Navegar para a tela de assinatura
  const navigateToSubscription = () => {
    if (isPremium) {
      // Se já é premium, mostrar detalhes da assinatura
      navigation.navigate('SubscriptionDetails');
    } else {
      // Se não é premium, mostrar paywall
      navigation.navigate('Paywall');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b72f2f" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileInitials}>
              <Text style={styles.initialsText}>
                {user?.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : user?.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.userName}>
          {user?.displayName || 'Usuário'}
        </Text>
        
        <Text style={styles.userEmail}>
          {user?.email}
        </Text>
        
        <View style={[
          styles.subscriptionBadge,
          isPremium ? styles.premiumBadge : styles.freeBadge
        ]}>
          <Icon
            name={isPremium ? 'star' : 'person'}
            size={16}
            color="#fff"
          />
          <Text style={styles.subscriptionBadgeText}>
            {isPremium ? 'PREMIUM' : 'GRATUITO'}
          </Text>
        </View>
      </View>
      
      {isPremium && (
        <View style={styles.subscriptionInfoContainer}>
          <Text style={styles.subscriptionInfoTitle}>
            Informações da Assinatura
          </Text>
          
          <View style={styles.subscriptionInfoItem}>
            <Text style={styles.subscriptionInfoLabel}>Plano:</Text>
            <Text style={styles.subscriptionInfoValue}>
              {subscription?.plan === 'mensal' ? 'Mensal' : 'Anual'}
            </Text>
          </View>
          
          <View style={styles.subscriptionInfoItem}>
            <Text style={styles.subscriptionInfoLabel}>Válido até:</Text>
            <Text style={styles.subscriptionInfoValue}>
              {formatDate(subscription?.endDate)}
            </Text>
          </View>
          
          <View style={styles.subscriptionInfoItem}>
            <Text style={styles.subscriptionInfoLabel}>Renovação:</Text>
            <Text style={styles.subscriptionInfoValue}>
              {subscription?.autoRenew ? 'Automática' : 'Manual'}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyCourses')}
        >
          <Icon name="school" size={24} color="#23364e" />
          <Text style={styles.menuItemText}>Meus Cursos</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Icon name="favorite" size={24} color="#b72f2f" />
          <Text style={styles.menuItemText}>Favoritos</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Downloads')}
        >
          <Icon name="file-download" size={24} color="#367c53" />
          <Text style={styles.menuItemText}>Downloads</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={navigateToSubscription}
        >
          <Icon
            name={isPremium ? 'card-membership' : 'star-border'}
            size={24}
            color={isPremium ? '#9cac3b' : '#dec024'}
          />
          <Text style={styles.menuItemText}>
            {isPremium ? 'Minha Assinatura' : 'Assinar Premium'}
          </Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('WhatsAppSettings')}
        >
          <Icon name="chat" size={24} color="#25D366" />
          <Text style={styles.menuItemText}>Configurar WhatsApp</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color="#666" />
          <Text style={styles.menuItemText}>Configurações</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={signOut}
      >
        <Icon name="exit-to-app" size={20} color="#fff" />
        <Text style={styles.signOutButtonText}>Sair</Text>
      </TouchableOpacity>
      
      {!isPremium && (
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeTitle}>
            Atualize para o plano Premium
          </Text>
          
          <Text style={styles.upgradeDescription}>
            Tenha acesso a todos os cursos, playlists e e-books do MundoemCores.com.
          </Text>
          
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.upgradeButtonText}>CONHECER PLANOS</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#23364e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  premiumBadge: {
    backgroundColor: '#9cac3b',
  },
  freeBadge: {
    backgroundColor: '#666',
  },
  subscriptionBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  subscriptionInfoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    marginBottom: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  subscriptionInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 15,
  },
  subscriptionInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subscriptionInfoLabel: {
    fontSize: 16,
    color: '#666',
  },
  subscriptionInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#23364e',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b72f2f',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  upgradeContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23364e',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#367c53',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
```

## Integração com Hotmart

### 1. Serviço de Integração com Hotmart

Crie um arquivo `hotmartService.js` na pasta `services`:

```javascript
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

/**
 * Verifica o status da assinatura no Hotmart
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} - Informações da assinatura
 */
const checkSubscriptionStatus = async (userId) => {
  try {
    // Chamar função Cloud Function
    const result = await functions().httpsCallable('checkHotmartSubscription')({
      userId
    });
    
    return result.data;
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    throw error;
  }
};

/**
 * Atualiza o status da assinatura no Firestore
 * @param {string} userId - ID do usuário
 * @param {object} subscriptionData - Dados da assinatura
 * @returns {Promise<void>}
 */
const updateSubscriptionStatus = async (userId, subscriptionData) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        subscription: subscriptionData,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
    throw error;
  }
};

/**
 * Processa um webhook do Hotmart
 * @param {object} webhookData - Dados do webhook
 * @returns {Promise<void>}
 */
const processHotmartWebhook = async (webhookData) => {
  // Esta função será implementada no backend (Cloud Functions)
};

export default {
  checkSubscriptionStatus,
  updateSubscriptionStatus,
  processHotmartWebhook
};
```

### 2. Cloud Function para Webhook do Hotmart

Crie um arquivo `hotmartWebhook.js` na pasta `functions`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Webhook para receber notificações do Hotmart
 */
exports.hotmartWebhook = functions.https.onRequest(async (req, res) => {
  // Verificar método
  if (req.method !== 'POST') {
    res.status(405).send('Método não permitido');
    return;
  }
  
  try {
    const data = req.body;
    
    // Verificar se é um evento válido
    if (!data || !data.event || !data.data) {
      res.status(400).send('Dados inválidos');
      return;
    }
    
    // Registrar evento para debug
    console.log('Evento Hotmart recebido:', data.event);
    
    // Salvar evento no Firestore para referência
    await db.collection('hotmartEvents').add({
      event: data.event,
      data: data.data,
      receivedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Processar evento com base no tipo
    switch (data.event) {
      case 'PURCHASE_APPROVED':
        await handlePurchaseApproved(data.data);
        break;
      
      case 'PURCHASE_CANCELED':
      case 'PURCHASE_REFUNDED':
      case 'SUBSCRIPTION_CANCELED':
        await handleSubscriptionCanceled(data.data);
        break;
      
      case 'SUBSCRIPTION_REACTIVATED':
        await handleSubscriptionReactivated(data.data);
        break;
      
      default:
        console.log('Evento não processado:', data.event);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro interno');
  }
});

/**
 * Processa compra aprovada
 * @param {object} data - Dados da compra
 */
const handlePurchaseApproved = async (data) => {
  try {
    // Extrair informações relevantes
    const email = data.buyer.email;
    const productId = data.product.id;
    const subscriptionId = data.subscription?.id;
    const transactionId = data.purchase.transaction;
    const planName = data.subscription?.plan?.name?.toLowerCase() || 'mensal';
    
    // Verificar se é um produto válido
    const validProductIds = ['123456', '789012']; // Substitua pelos IDs reais
    if (!validProductIds.includes(productId)) {
      console.log('Produto não reconhecido:', productId);
      return;
    }
    
    // Buscar usuário pelo email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('Usuário não encontrado para o email:', email);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    
    // Calcular data de término da assinatura
    const now = new Date();
    let endDate;
    
    if (planName.includes('anual')) {
      // Plano anual: adicionar 1 ano
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Plano mensal: adicionar 1 mês
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Atualizar assinatura do usuário
    await db.collection('users')
      .doc(userId)
      .update({
        subscription: {
          status: 'premium',
          plan: planName.includes('anual') ? 'anual' : 'mensal',
          startDate: admin.firestore.Timestamp.fromDate(now),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          autoRenew: true,
          paymentMethod: 'hotmart',
          paymentId: transactionId,
          subscriptionId: subscriptionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    
    console.log('Assinatura ativada para usuário:', userId);
  } catch (error) {
    console.error('Erro ao processar compra aprovada:', error);
    throw error;
  }
};

/**
 * Processa cancelamento de assinatura
 * @param {object} data - Dados do cancelamento
 */
const handleSubscriptionCanceled = async (data) => {
  try {
    // Extrair informações relevantes
    const email = data.buyer.email;
    const subscriptionId = data.subscription?.id;
    
    // Buscar usuário pelo email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('Usuário não encontrado para o email:', email);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userData = usersSnapshot.docs[0].data();
    
    // Verificar se é a mesma assinatura
    if (userData.subscription?.subscriptionId !== subscriptionId) {
      console.log('ID de assinatura não corresponde:', subscriptionId);
      return;
    }
    
    // Atualizar assinatura do usuário
    await db.collection('users')
      .doc(userId)
      .update({
        'subscription.status': 'free',
        'subscription.autoRenew': false,
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log('Assinatura cancelada para usuário:', userId);
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    throw error;
  }
};

/**
 * Processa reativação de assinatura
 * @param {object} data - Dados da reativação
 */
const handleSubscriptionReactivated = async (data) => {
  try {
    // Extrair informações relevantes
    const email = data.buyer.email;
    const subscriptionId = data.subscription?.id;
    
    // Buscar usuário pelo email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('Usuário não encontrado para o email:', email);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    
    // Calcular nova data de término
    const now = new Date();
    let endDate;
    
    const planName = data.subscription?.plan?.name?.toLowerCase() || 'mensal';
    
    if (planName.includes('anual')) {
      // Plano anual: adicionar 1 ano
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Plano mensal: adicionar 1 mês
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Atualizar assinatura do usuário
    await db.collection('users')
      .doc(userId)
      .update({
        'subscription.status': 'premium',
        'subscription.autoRenew': true,
        'subscription.startDate': admin.firestore.Timestamp.fromDate(now),
        'subscription.endDate': admin.firestore.Timestamp.fromDate(endDate),
        'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log('Assinatura reativada para usuário:', userId);
  } catch (error) {
    console.error('Erro ao processar reativação de assinatura:', error);
    throw error;
  }
};

/**
 * Função para verificar status da assinatura no Hotmart
 */
exports.checkHotmartSubscription = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }
  
  try {
    const userId = data.userId || context.auth.uid;
    
    // Buscar usuário
    const userDoc = await db.collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Usuário não encontrado'
      );
    }
    
    const userData = userDoc.data();
    
    // Se não tem assinatura, retornar status free
    if (!userData.subscription || !userData.subscription.subscriptionId) {
      return { status: 'free' };
    }
    
    // Verificar se a assinatura expirou
    const subscription = userData.subscription;
    
    if (subscription.endDate && subscription.endDate.toDate() < new Date()) {
      // Assinatura expirada
      if (subscription.autoRenew) {
        // Se tem renovação automática, verificar no Hotmart
        // Aqui você implementaria a chamada à API do Hotmart
        // Como exemplo, estamos apenas retornando o status atual
        return subscription;
      } else {
        // Se não tem renovação automática, atualizar para free
        await db.collection('users')
          .doc(userId)
          .update({
            'subscription.status': 'free',
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
          });
        
        return { status: 'free' };
      }
    }
    
    // Retornar status atual
    return subscription;
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao verificar assinatura'
    );
  }
});
```

### 3. Atualização do index.js para Cloud Functions

Atualize o arquivo `index.js` na pasta `functions`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Importar funções do webhook do WhatsApp
const { whatsappWebhook } = require('./whatsappWebhook');

// Importar funções do webhook do Hotmart
const { hotmartWebhook, checkHotmartSubscription } = require('./hotmartWebhook');

// Exportar funções
exports.whatsappWebhook = whatsappWebhook;
exports.hotmartWebhook = hotmartWebhook;
exports.checkHotmartSubscription = checkHotmartSubscription;

// Função para verificar e atualizar assinaturas expiradas
exports.checkExpiredSubscriptions = functions.pubsub
  .schedule('0 0 * * *') // Todos os dias à meia-noite
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Buscar usuários com assinaturas expiradas
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('subscription.status', '==', 'premium')
        .where('subscription.endDate', '<', now)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('Nenhuma assinatura expirada encontrada');
        return null;
      }
      
      // Processar cada usuário
      const batch = admin.firestore().batch();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        
        // Se tem renovação automática, não alterar status
        if (userData.subscription.autoRenew) {
          console.log(`Usuário ${doc.id} tem renovação automática, verificando no Hotmart...`);
          // Aqui você implementaria a verificação no Hotmart
          // Como exemplo, estamos apenas ignorando
          return;
        }
        
        // Atualizar status para free
        batch.update(doc.ref, {
          'subscription.status': 'free',
          'subscription.updatedAt': now
        });
      });
      
      // Executar batch
      await batch.commit();
      
      console.log(`${usersSnapshot.size} assinaturas atualizadas`);
      return null;
    } catch (error) {
      console.error('Erro ao verificar assinaturas expiradas:', error);
      return null;
    }
  });
```

## Considerações de Segurança

1. **Proteção de Conteúdo**: Implemente regras de segurança no Firestore para controlar o acesso ao conteúdo premium
2. **Verificação de Assinaturas**: Verifique regularmente o status das assinaturas para evitar acesso não autorizado
3. **Validação de Webhooks**: Implemente validação de assinatura nos webhooks do Hotmart para garantir a autenticidade das requisições
4. **Armazenamento Seguro**: Armazene informações de pagamento de forma segura e em conformidade com as regulamentações

## Testes

### 1. Teste de Acesso a Conteúdo

1. Crie um usuário gratuito e verifique se ele tem acesso apenas à primeira aula de cada curso e conteúdos marcados como gratuitos
2. Simule um usuário premium e verifique se ele tem acesso a todo o conteúdo

### 2. Teste de Integração com Hotmart

1. Simule eventos de webhook do Hotmart para testar o processamento de compras, cancelamentos e reativações
2. Verifique se o status da assinatura é atualizado corretamente no Firestore

### 3. Teste de Interface do Usuário

1. Verifique se os componentes de conteúdo bloqueado são exibidos corretamente
2. Teste a navegação para a tela de paywall quando um usuário gratuito tenta acessar conteúdo premium

## Recursos Adicionais

- [Documentação do Hotmart](https://developers.hotmart.com/)
- [Guia de Implementação de Modelos Freemium](https://www.apptamin.com/blog/freemium-app-model/)
- [Documentação do Firebase Authentication](https://firebase.google.com/docs/auth)
- [Documentação do Firestore](https://firebase.google.com/docs/firestore)

## Suporte

Para questões relacionadas à implementação do modelo freemium, entre em contato com:
- Email: contato@mundoemcores.com
