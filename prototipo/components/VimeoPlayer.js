import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, FONT, SIZES } from '../assets/theme';
import vimeoService from '../services/vimeoService';

/**
 * Componente de Player de Vídeo do Vimeo
 * Reproduz vídeos do Vimeo com controles personalizados
 */
const VimeoPlayer = ({ videoId, autoPlay = false, onError, onLoad, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    // Carrega a URL de reprodução do vídeo
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Em uma implementação real, isso buscaria a URL de reprodução da API do Vimeo
        const url = await vimeoService.getVideoPlaybackUrl(videoId);
        setVideoUrl(url);
      } catch (err) {
        console.error('Erro ao carregar vídeo:', err);
        setError('Não foi possível carregar o vídeo. Por favor, tente novamente mais tarde.');
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      loadVideo();
    }
  }, [videoId]);

  // HTML para incorporar o player do Vimeo
  const getVimeoEmbedHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: 0;
          }
        </style>
      </head>
      <body>
        <iframe 
          src="https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}&title=0&byline=0&portrait=0"
          frameborder="0" 
          allow="autoplay; fullscreen" 
          allowfullscreen
        ></iframe>
        <script src="https://player.vimeo.com/api/player.js"></script>
        <script>
          // Script para comunicação entre o player e o React Native
          const player = new Vimeo.Player(document.querySelector('iframe'));
          
          player.on('play', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'play'}));
          });
          
          player.on('pause', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'pause'}));
          });
          
          player.on('ended', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ended'}));
          });
          
          player.on('timeupdate', function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'timeupdate',
              seconds: data.seconds,
              percent: data.percent,
              duration: data.duration
            }));
          });
          
          player.on('loaded', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'loaded'}));
          });
          
          player.on('error', function(error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.message
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  // Manipula mensagens do WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'loaded':
          if (onLoad) onLoad();
          break;
        case 'error':
          if (onError) onError(new Error(data.message));
          break;
        // Outros eventos podem ser tratados conforme necessário
      }
    } catch (err) {
      console.error('Erro ao processar mensagem do WebView:', err);
    }
  };

  // Comandos para controlar o player
  const playerCommands = {
    play: () => {
      webViewRef.current?.injectJavaScript('player.play(); true;');
    },
    pause: () => {
      webViewRef.current?.injectJavaScript('player.pause(); true;');
    },
    seekTo: (seconds) => {
      webViewRef.current?.injectJavaScript(`player.setCurrentTime(${seconds}); true;`);
    },
    setVolume: (volume) => {
      webViewRef.current?.injectJavaScript(`player.setVolume(${volume}); true;`);
    },
    getDuration: () => {
      webViewRef.current?.injectJavaScript('player.getDuration().then(duration => { window.ReactNativeWebView.postMessage(JSON.stringify({type: "duration", value: duration})); }); true;');
    },
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Tenta carregar o vídeo novamente
            vimeoService.getVideoPlaybackUrl(videoId)
              .then(url => {
                setVideoUrl(url);
                setLoading(false);
              })
              .catch(err => {
                setError('Não foi possível carregar o vídeo. Por favor, tente novamente mais tarde.');
                setLoading(false);
                if (onError) onError(err);
              });
          }}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando vídeo...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: getVimeoEmbedHtml() }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={Platform.OS !== 'android'}
        allowsFullscreenVideo={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
  errorText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
  },
});

export default VimeoPlayer;
