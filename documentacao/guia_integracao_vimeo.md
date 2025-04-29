# Guia de Implementação da API do Vimeo

## Visão Geral

Este documento fornece instruções detalhadas para implementar a integração com a API do Vimeo no aplicativo MundoemCores.com. A integração permitirá que os vídeos dos cursos hospedados no Vimeo sejam reproduzidos diretamente no aplicativo, mantendo a proteção de conteúdo.

## Pré-requisitos

1. Conta Vimeo Pro, Business ou Premium (necessária para API e recursos de privacidade)
2. Acesso ao [Portal de Desenvolvedores do Vimeo](https://developer.vimeo.com/)
3. Credenciais de API (Client ID, Client Secret, Access Token)

## Configuração da Conta Vimeo

### 1. Criar Aplicativo no Portal de Desenvolvedores

1. Acesse [developer.vimeo.com](https://developer.vimeo.com/)
2. Faça login com sua conta Vimeo
3. Navegue até "Create App"
4. Preencha as informações do aplicativo:
   - Nome: MundoemCores App
   - Descrição: Aplicativo educacional para pais
   - URL do aplicativo: URL do seu aplicativo ou site
   - URL de callback: URL para redirecionamento após autenticação
5. Selecione os escopos necessários:
   - `public`
   - `private`
   - `video_files`
   - `interact`

### 2. Obter Credenciais de API

Após criar o aplicativo, você receberá:
- Client ID
- Client Secret
- Access Token (gere um token de acesso com os escopos necessários)

Estas credenciais devem ser armazenadas de forma segura e não devem ser expostas no código-fonte do aplicativo.

## Implementação no React Native

### 1. Instalação de Dependências

```bash
npm install axios react-native-webview
# ou
yarn add axios react-native-webview
```

### 2. Configuração do Serviço Vimeo

Crie um arquivo `vimeoService.js` na pasta `services`:

```javascript
import axios from 'axios';
import { Platform } from 'react-native';

// Configuração da API do Vimeo
const VIMEO_API_URL = 'https://api.vimeo.com';
const VIMEO_ACCESS_TOKEN = 'SEU_ACCESS_TOKEN'; // Substitua pelo token real

// Criar instância do axios configurada
const vimeoApi = axios.create({
  baseURL: VIMEO_API_URL,
  headers: {
    'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.vimeo.*+json;version=3.4'
  }
});

/**
 * Busca informações de um vídeo específico
 * @param {string} videoId - ID do vídeo no Vimeo
 * @returns {Promise} - Promessa com dados do vídeo
 */
const getVideoById = async (videoId) => {
  try {
    const response = await vimeoApi.get(`/videos/${videoId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    throw error;
  }
};

/**
 * Obtém a URL de reprodução de um vídeo
 * @param {string} videoId - ID do vídeo no Vimeo
 * @returns {Promise<string>} - URL de reprodução do vídeo
 */
const getPlaybackUrl = async (videoId) => {
  try {
    const video = await getVideoById(videoId);
    
    // Selecionar a melhor qualidade disponível com base na plataforma
    const files = video.files;
    let selectedFile;
    
    if (Platform.OS === 'ios') {
      // Para iOS, preferir HLS
      selectedFile = files.find(file => file.quality === 'hls');
    }
    
    if (!selectedFile) {
      // Fallback para qualidade HD ou a melhor disponível
      selectedFile = files.find(file => file.quality === 'hd') || 
                    files.find(file => file.quality === 'sd') ||
                    files[0]; // Último recurso
    }
    
    return selectedFile.link;
  } catch (error) {
    console.error('Erro ao obter URL de reprodução:', error);
    throw error;
  }
};

/**
 * Busca vídeos de uma pasta específica
 * @param {string} folderId - ID da pasta no Vimeo
 * @returns {Promise} - Promessa com lista de vídeos
 */
const getVideosFromFolder = async (folderId) => {
  try {
    const response = await vimeoApi.get(`/folders/${folderId}/videos`, {
      params: {
        per_page: 100,
        fields: 'uri,name,description,duration,pictures,privacy'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar vídeos da pasta:', error);
    throw error;
  }
};

/**
 * Busca pastas de um usuário
 * @param {string} userId - ID do usuário no Vimeo (use 'me' para o usuário autenticado)
 * @returns {Promise} - Promessa com lista de pastas
 */
const getUserFolders = async (userId = 'me') => {
  try {
    const response = await vimeoApi.get(`/users/${userId}/folders`, {
      params: {
        per_page: 100
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar pastas do usuário:', error);
    throw error;
  }
};

/**
 * Busca vídeos por termo de pesquisa
 * @param {string} query - Termo de pesquisa
 * @returns {Promise} - Promessa com resultados da pesquisa
 */
const searchVideos = async (query) => {
  try {
    const response = await vimeoApi.get('/videos', {
      params: {
        query,
        per_page: 20,
        fields: 'uri,name,description,duration,pictures'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Erro na pesquisa de vídeos:', error);
    throw error;
  }
};

/**
 * Atualiza o progresso de visualização de um vídeo
 * @param {string} videoId - ID do vídeo no Vimeo
 * @param {number} seconds - Segundos assistidos
 * @returns {Promise} - Promessa com resultado da atualização
 */
const updateWatchProgress = async (videoId, seconds) => {
  try {
    // Esta funcionalidade pode exigir implementação personalizada
    // dependendo de como você deseja rastrear o progresso
    // Pode ser armazenado localmente ou em seu próprio backend
    console.log(`Atualizando progresso do vídeo ${videoId}: ${seconds} segundos`);
    
    // Exemplo de implementação com Firebase
    // await firestore()
    //   .collection('users')
    //   .doc(userId)
    //   .collection('progress')
    //   .doc(videoId)
    //   .set({ seconds, updatedAt: firestore.FieldValue.serverTimestamp() });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    throw error;
  }
};

export default {
  getVideoById,
  getPlaybackUrl,
  getVideosFromFolder,
  getUserFolders,
  searchVideos,
  updateWatchProgress
};
```

### 3. Componente de Player de Vídeo

Crie um arquivo `VimeoPlayer.js` na pasta `components`:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import vimeoService from '../services/vimeoService';

const VimeoPlayer = ({ videoId, onError, onLoad, onProgress, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const webViewRef = useRef(null);
  
  // Buscar URL de reprodução quando o componente montar ou videoId mudar
  useEffect(() => {
    const fetchPlaybackUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = await vimeoService.getPlaybackUrl(videoId);
        setPlaybackUrl(url);
        
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        console.error('Erro ao carregar vídeo:', err);
        setError('Não foi possível carregar o vídeo. Por favor, tente novamente.');
        
        if (onError) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (videoId) {
      fetchPlaybackUrl();
    }
  }, [videoId]);
  
  // HTML para incorporar o player de vídeo
  const getVideoHTML = (url) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            overflow: hidden;
          }
          video {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <video 
          id="vimeoPlayer"
          controls
          autoplay
          playsinline
          webkit-playsinline
          src="${url}"
        ></video>
        <script>
          // Script para monitorar progresso e enviar para o React Native
          const video = document.getElementById('vimeoPlayer');
          
          video.addEventListener('timeupdate', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'progress',
              currentTime: video.currentTime,
              duration: video.duration
            }));
          });
          
          video.addEventListener('ended', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ended'
            }));
          });
          
          video.addEventListener('error', (e) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Erro ao reproduzir vídeo'
            }));
          });
        </script>
      </body>
      </html>
    `;
  };
  
  // Manipular mensagens do WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'progress' && onProgress) {
        onProgress(data.currentTime, data.duration);
        
        // Atualizar progresso a cada 10 segundos
        if (Math.floor(data.currentTime) % 10 === 0) {
          vimeoService.updateWatchProgress(videoId, data.currentTime);
        }
      }
      
      if (data.type === 'ended') {
        // Marcar vídeo como concluído
        vimeoService.updateWatchProgress(videoId, -1); // -1 pode indicar conclusão
      }
      
      if (data.type === 'error') {
        setError('Erro ao reproduzir o vídeo');
        if (onError) {
          onError(new Error(data.message));
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem do WebView:', err);
    }
  };
  
  // Renderizar estados de carregamento e erro
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#b72f2f" />
        <Text style={styles.loadingText}>Carregando vídeo...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            vimeoService.getPlaybackUrl(videoId)
              .then(url => {
                setPlaybackUrl(url);
                setError(null);
                if (onLoad) onLoad();
              })
              .catch(err => {
                setError('Não foi possível carregar o vídeo. Por favor, tente novamente.');
                if (onError) onError(err);
              })
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Renderizar o player de vídeo
  return (
    <View style={[styles.container, style]}>
      {playbackUrl && (
        <WebView
          ref={webViewRef}
          source={{ html: getVideoHTML(playbackUrl) }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onError={() => {
            setError('Erro ao carregar o player de vídeo');
            if (onError) onError(new Error('WebView error'));
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#b72f2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VimeoPlayer;
```

### 4. Implementação na Tela de Reprodução de Vídeo

Crie ou atualize o arquivo `VideoPlayerScreen.js` na pasta `screens`:

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import VimeoPlayer from '../components/VimeoPlayer';
import vimeoService from '../services/vimeoService';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext'; // Ajuste conforme sua implementação

const VideoPlayerScreen = ({ route, navigation }) => {
  const { courseId, lessonId, videoId, title, description } = route.params;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nextLesson, setNextLesson] = useState(null);
  const [prevLesson, setPrevLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Buscar informações das lições anterior e próxima
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const lessonsSnapshot = await firestore()
          .collection('courses')
          .doc(courseId)
          .collection('lessons')
          .orderBy('order')
          .get();
        
        const lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const currentIndex = lessons.findIndex(lesson => lesson.id === lessonId);
        
        if (currentIndex > 0) {
          setPrevLesson(lessons[currentIndex - 1]);
        }
        
        if (currentIndex < lessons.length - 1) {
          setNextLesson(lessons[currentIndex + 1]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar lições:', error);
        setLoading(false);
      }
    };
    
    fetchLessons();
    
    // Buscar progresso salvo
    const fetchProgress = async () => {
      try {
        const progressDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('progress')
          .doc(videoId)
          .get();
        
        if (progressDoc.exists) {
          const savedTime = progressDoc.data().seconds;
          // Só restaurar se for menor que 95% da duração (para não restaurar vídeos quase concluídos)
          if (savedTime && duration && savedTime < (duration * 0.95)) {
            setCurrentTime(savedTime);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar progresso:', error);
      }
    };
    
    if (user && videoId) {
      fetchProgress();
    }
  }, [courseId, lessonId, videoId, user, duration]);
  
  // Manipular progresso do vídeo
  const handleProgress = (time, totalDuration) => {
    setCurrentTime(time);
    if (!duration && totalDuration) {
      setDuration(totalDuration);
    }
  };
  
  // Formatar tempo (segundos para MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calcular porcentagem de progresso
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Player de Vídeo */}
      <VimeoPlayer
        videoId={videoId}
        style={styles.player}
        onProgress={handleProgress}
        onError={(error) => console.error('Erro no player:', error)}
      />
      
      {/* Barra de Progresso */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        <Text style={styles.progressText}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
      </View>
      
      {/* Informações da Aula */}
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </ScrollView>
      
      {/* Navegação entre Aulas */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, !prevLesson && styles.disabledButton]}
          disabled={!prevLesson}
          onPress={() => {
            if (prevLesson) {
              navigation.replace('VideoPlayer', {
                courseId,
                lessonId: prevLesson.id,
                videoId: prevLesson.videoId,
                title: prevLesson.title,
                description: prevLesson.description
              });
            }
          }}
        >
          <Icon name="arrow-back" size={24} color={prevLesson ? '#fff' : '#666'} />
          <Text style={[styles.navText, !prevLesson && styles.disabledText]}>
            Aula Anterior
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.courseButton}
          onPress={() => navigation.navigate('CourseDetail', { courseId })}
        >
          <Icon name="list" size={24} color="#fff" />
          <Text style={styles.navText}>Voltar ao Curso</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, !nextLesson && styles.disabledButton]}
          disabled={!nextLesson}
          onPress={() => {
            if (nextLesson) {
              // Marcar aula atual como concluída
              if (user) {
                firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('completedLessons')
                  .doc(lessonId)
                  .set({
                    courseId,
                    completedAt: firestore.FieldValue.serverTimestamp()
                  });
              }
              
              navigation.replace('VideoPlayer', {
                courseId,
                lessonId: nextLesson.id,
                videoId: nextLesson.videoId,
                title: nextLesson.title,
                description: nextLesson.description
              });
            }
          }}
        >
          <Text style={[styles.navText, !nextLesson && styles.disabledText]}>
            Próxima Aula
          </Text>
          <Icon name="arrow-forward" size={24} color={nextLesson ? '#fff' : '#666'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23364e',
  },
  player: {
    width: '100%',
    height: 240,
  },
  progressContainer: {
    height: 30,
    backgroundColor: '#1a2a3a',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#b72f2f',
  },
  progressText: {
    position: 'absolute',
    right: 10,
    top: 5,
    color: '#fff',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1a2a3a',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#367c53',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navText: {
    color: '#fff',
    marginHorizontal: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
  },
});

export default VideoPlayerScreen;
```

## Organização de Conteúdo no Vimeo

Para facilitar a gestão de conteúdo no aplicativo, recomenda-se organizar os vídeos no Vimeo da seguinte forma:

### 1. Estrutura de Pastas

- Criar uma pasta principal para o MundoemCores
- Dentro dela, criar subpastas para cada curso
- Nomear os vídeos de forma consistente, incluindo número da aula

Exemplo:
```
MundoemCores/
├── Montessori em Casa/
│   ├── 01 - Introdução ao Método Montessori.mp4
│   ├── 02 - Preparando o Ambiente.mp4
│   └── ...
├── Disciplina Positiva/
│   ├── 01 - Fundamentos da Disciplina Positiva.mp4
│   └── ...
└── ...
```

### 2. Configurações de Privacidade

Para proteger o conteúdo:

1. Configure os vídeos como "Privado"
2. Em "Onde os vídeos podem ser incorporados", selecione "Domínios específicos"
3. Adicione os domínios do seu aplicativo e site

### 3. Metadados dos Vídeos

Para cada vídeo, preencha:
- Título descritivo
- Descrição detalhada
- Tags relevantes
- Miniatura personalizada

## Mapeamento no Firestore

Para integrar os vídeos do Vimeo com seu aplicativo, crie uma estrutura no Firestore:

```
courses/
├── [courseId]/
│   ├── title: "Montessori em Casa"
│   ├── description: "Aprenda a aplicar o método Montessori..."
│   ├── instructor: "Isa Minatel"
│   ├── thumbnail: "URL_DA_IMAGEM"
│   ├── isFree: false
│   └── lessons/
│       ├── [lessonId]/
│       │   ├── title: "Introdução ao Método Montessori"
│       │   ├── description: "Nesta aula você aprenderá..."
│       │   ├── videoId: "123456789" // ID do vídeo no Vimeo
│       │   ├── duration: 1520 // Duração em segundos
│       │   ├── order: 1 // Ordem da aula no curso
│       │   └── isFree: true // Se é uma aula gratuita
│       └── ...
└── ...
```

## Considerações de Desempenho

1. **Pré-carregamento**: Implemente pré-carregamento de metadados de vídeo para melhorar a experiência do usuário
2. **Qualidade Adaptativa**: Configure o player para ajustar a qualidade com base na conexão
3. **Cache**: Implemente cache de metadados para reduzir chamadas à API
4. **Monitoramento**: Monitore o uso da API para evitar atingir limites

## Solução de Problemas Comuns

### Erro de CORS

Se encontrar erros de CORS:
1. Verifique se os domínios estão corretamente configurados nas configurações de privacidade do Vimeo
2. Certifique-se de que está usando o token de acesso correto com os escopos necessários

### Vídeo Não Reproduz

Se os vídeos não reproduzirem:
1. Verifique se o ID do vídeo está correto
2. Confirme que o vídeo não está definido como "Somente eu posso ver"
3. Verifique se o token de acesso tem permissões suficientes

### Lentidão no Carregamento

Se o carregamento for lento:
1. Implemente carregamento progressivo
2. Reduza a qualidade inicial do vídeo
3. Implemente pré-carregamento de miniaturas

## Recursos Adicionais

- [Documentação da API do Vimeo](https://developer.vimeo.com/api/reference)
- [Guia de Autenticação do Vimeo](https://developer.vimeo.com/api/authentication)
- [Exemplos de Código](https://developer.vimeo.com/api/samples)
- [Fórum de Desenvolvedores do Vimeo](https://vimeo.com/forums/api)

## Suporte

Para questões relacionadas à integração com o Vimeo, entre em contato com:
- Email: contato@mundoemcores.com
