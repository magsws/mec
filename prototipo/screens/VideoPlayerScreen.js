import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONT, SIZES } from '../assets/theme';
import CoraAssistant from '../components/CoraAssistant';
import VimeoPlayer from '../components/VimeoPlayer';
import vimeoService from '../services/vimeoService';

/**
 * Tela de Player de Vídeo Atualizada
 * Reproduz vídeos do Vimeo com controles e informações do curso
 * Utiliza o componente VimeoPlayer para integração com a API do Vimeo
 */
const VideoPlayerScreen = ({ route, navigation }) => {
  // Em uma implementação real, usaríamos esses parâmetros para carregar o vídeo
  // const { videoId, title, courseTitle } = route.params;
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);
  
  // ID de exemplo para o protótipo
  const videoId = '12345678';

  useEffect(() => {
    // Carrega os dados do vídeo
    const loadVideoData = async () => {
      try {
        setLoading(true);
        // Em uma implementação real, isso buscaria os dados do vídeo da API
        const data = await vimeoService.getVideoInfo(videoId);
        setVideoData({
          id: videoId,
          title: 'Introdução ao Desenvolvimento Infantil',
          courseTitle: 'Desenvolvimento Infantil: Primeiros Anos',
          description: 'Nesta aula introdutória, vamos conhecer os conceitos básicos do desenvolvimento infantil e a importância dos primeiros anos de vida para a formação cerebral.',
          duration: '30 min',
        });
      } catch (err) {
        console.error('Erro ao carregar dados do vídeo:', err);
        setError('Não foi possível carregar as informações do vídeo.');
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [videoId]);

  // Manipula erros do player
  const handlePlayerError = (err) => {
    console.error('Erro no player:', err);
    setError('Ocorreu um erro ao reproduzir o vídeo. Por favor, tente novamente mais tarde.');
  };

  // Manipula o carregamento do player
  const handlePlayerLoad = () => {
    console.log('Vídeo carregado com sucesso');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando vídeo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation ? navigation.goBack() : null}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Player de vídeo do Vimeo */}
      <VimeoPlayer
        videoId={videoId}
        autoPlay={false}
        onError={handlePlayerError}
        onLoad={handlePlayerLoad}
        style={styles.videoPlayer}
      />

      <ScrollView style={styles.contentContainer}>
        {/* Informações do vídeo */}
        <View style={styles.videoInfoContainer}>
          <Text style={styles.videoTitle}>{videoData.title}</Text>
          <Text style={styles.courseTitle}>{videoData.courseTitle}</Text>
          <Text style={styles.videoDuration}>Duração: {videoData.duration}</Text>
        </View>

        {/* Descrição do vídeo */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Sobre esta aula</Text>
          <Text style={styles.descriptionText}>{videoData.description}</Text>
        </View>

        {/* Botões de navegação entre aulas */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navButtonText}>← Aula Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navButtonText}>Próxima Aula →</Text>
          </TouchableOpacity>
        </View>

        {/* Botão para voltar ao curso */}
        <TouchableOpacity 
          style={styles.backToCourseButton}
          onPress={() => navigation ? navigation.goBack() : null}
        >
          <Text style={styles.backToCourseButtonText}>Voltar ao Curso</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Assistente Cora (componente flutuante) */}
      <CoraAssistant />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16/9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  videoInfoContainer: {
    marginBottom: 20,
  },
  videoTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xLarge,
    color: COLORS.dark,
    marginBottom: 5,
  },
  courseTitle: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginBottom: 5,
  },
  videoDuration: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.dark,
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  navButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  backToCourseButton: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  backToCourseButtonText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
});

export default VideoPlayerScreen;
