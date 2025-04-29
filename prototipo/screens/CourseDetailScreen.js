import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONT, SIZES, SHADOWS } from '../assets/theme';
import CoraAssistant from '../components/CoraAssistant';

/**
 * Tela de Detalhes do Curso
 * Exibe informações detalhadas sobre um curso específico e suas aulas
 */
const CourseDetailScreen = ({ route, navigation }) => {
  // Em uma implementação real, usaríamos o courseId para buscar os dados do curso
  // const { courseId } = route.params;
  
  const [selectedTab, setSelectedTab] = useState('about');
  
  // Dados de exemplo para o curso
  const courseData = {
    id: '1',
    title: 'Desenvolvimento Infantil: Primeiros Anos',
    description: 'Neste curso, você aprenderá como estimular o desenvolvimento cognitivo, motor e emocional nos primeiros anos de vida do seu filho. Baseado em pesquisas do Center of Developing Child de Harvard, o curso oferece estratégias práticas e fundamentadas cientificamente para apoiar o desenvolvimento saudável da criança.',
    thumbnail: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    instructor: 'Dra. Maria Silva',
    duration: '6 horas',
    isFree: true,
    lessons: [
      {
        id: '1',
        title: 'Introdução ao Desenvolvimento Infantil',
        duration: '30 min',
        isFree: true,
        videoId: '12345678', // ID do vídeo no Vimeo
      },
      {
        id: '2',
        title: 'Desenvolvimento Cerebral nos Primeiros Anos',
        duration: '45 min',
        isFree: false,
        videoId: '23456789',
      },
      {
        id: '3',
        title: 'Estímulos Adequados para Cada Fase',
        duration: '60 min',
        isFree: false,
        videoId: '34567890',
      },
      {
        id: '4',
        title: 'Brincadeiras que Estimulam o Desenvolvimento',
        duration: '45 min',
        isFree: false,
        videoId: '45678901',
      },
      {
        id: '5',
        title: 'O Papel dos Pais no Desenvolvimento Infantil',
        duration: '60 min',
        isFree: false,
        videoId: '56789012',
      },
      {
        id: '6',
        title: 'Sinais de Alerta e Quando Buscar Ajuda',
        duration: '45 min',
        isFree: false,
        videoId: '67890123',
      },
    ],
    materials: [
      {
        id: '1',
        title: 'Guia de Atividades por Idade',
        type: 'pdf',
      },
      {
        id: '2',
        title: 'Checklist de Desenvolvimento',
        type: 'pdf',
      },
    ],
  };

  // Renderiza cada aula do curso
  const renderLesson = (lesson, index) => (
    <TouchableOpacity 
      key={lesson.id}
      style={styles.lessonItem}
      onPress={() => navigation ? navigation.navigate('VideoPlayer', { 
        videoId: lesson.videoId,
        title: lesson.title,
        courseTitle: courseData.title
      }) : null}
    >
      <View style={styles.lessonNumber}>
        <Text style={styles.lessonNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
      </View>
      {lesson.isFree ? (
        <View style={styles.freeTag}>
          <Text style={styles.freeTagText}>Gratuito</Text>
        </View>
      ) : (
        <View style={styles.lockIcon}>
          <Text>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Renderiza cada material complementar
  const renderMaterial = (material) => (
    <TouchableOpacity 
      key={material.id}
      style={styles.materialItem}
      onPress={() => {/* Abrir material */}}
    >
      <View style={styles.materialIcon}>
        <Text>📄</Text>
      </View>
      <Text style={styles.materialTitle}>{material.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Imagem de capa do curso */}
      <Image 
        source={{ uri: courseData.thumbnail }} 
        style={styles.coverImage}
        resizeMode="cover"
      />
      
      {/* Botão de voltar */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation ? navigation.goBack() : null}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Informações do curso */}
          <Text style={styles.title}>{courseData.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.instructor}>Por: {courseData.instructor}</Text>
            <Text style={styles.duration}>Duração: {courseData.duration}</Text>
          </View>

          {/* Abas de navegação */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'about' && styles.activeTab]}
              onPress={() => setSelectedTab('about')}
            >
              <Text style={[styles.tabText, selectedTab === 'about' && styles.activeTabText]}>Sobre</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'lessons' && styles.activeTab]}
              onPress={() => setSelectedTab('lessons')}
            >
              <Text style={[styles.tabText, selectedTab === 'lessons' && styles.activeTabText]}>Aulas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'materials' && styles.activeTab]}
              onPress={() => setSelectedTab('materials')}
            >
              <Text style={[styles.tabText, selectedTab === 'materials' && styles.activeTabText]}>Materiais</Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo da aba selecionada */}
          {selectedTab === 'about' && (
            <View style={styles.aboutContainer}>
              <Text style={styles.sectionTitle}>Descrição do Curso</Text>
              <Text style={styles.description}>{courseData.description}</Text>
              
              <Text style={styles.sectionTitle}>O que você aprenderá</Text>
              <View style={styles.learningPoints}>
                <View style={styles.learningPoint}>
                  <Text style={styles.learningPointBullet}>•</Text>
                  <Text style={styles.learningPointText}>Compreender as fases do desenvolvimento infantil</Text>
                </View>
                <View style={styles.learningPoint}>
                  <Text style={styles.learningPointBullet}>•</Text>
                  <Text style={styles.learningPointText}>Identificar estímulos adequados para cada idade</Text>
                </View>
                <View style={styles.learningPoint}>
                  <Text style={styles.learningPointBullet}>•</Text>
                  <Text style={styles.learningPointText}>Criar um ambiente propício ao desenvolvimento</Text>
                </View>
                <View style={styles.learningPoint}>
                  <Text style={styles.learningPointBullet}>•</Text>
                  <Text style={styles.learningPointText}>Reconhecer sinais de alerta no desenvolvimento</Text>
                </View>
              </View>
            </View>
          )}

          {selectedTab === 'lessons' && (
            <View style={styles.lessonsContainer}>
              {courseData.lessons.map((lesson, index) => renderLesson(lesson, index))}
            </View>
          )}

          {selectedTab === 'materials' && (
            <View style={styles.materialsContainer}>
              {courseData.materials.map(material => renderMaterial(material))}
            </View>
          )}

          {/* Botão de inscrição/acesso */}
          <TouchableOpacity 
            style={styles.enrollButton}
            onPress={() => {/* Lógica de inscrição/acesso */}}
          >
            <Text style={styles.enrollButtonText}>
              {courseData.isFree ? 'Acessar Curso Gratuito' : 'Inscrever-se'}
            </Text>
          </TouchableOpacity>
        </View>
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
  coverImage: {
    width: '100%',
    height: 200,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xLarge,
    color: COLORS.dark,
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  instructor: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
    marginRight: 15,
  },
  duration: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
  },
  activeTabText: {
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },
  aboutContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.dark,
    marginBottom: 10,
    marginTop: 15,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  learningPoints: {
    marginTop: 10,
  },
  learningPoint: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  learningPointBullet: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
    marginRight: 10,
  },
  learningPointText: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
  },
  lessonsContainer: {
    marginBottom: 20,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  lessonNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonNumberText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.dark,
    marginBottom: 5,
  },
  lessonDuration: {
    fontFamily: FONT.regular,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
  },
  freeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
  },
  freeTagText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.small,
    color: COLORS.white,
  },
  lockIcon: {
    width: 30,
    alignItems: 'center',
  },
  materialsContainer: {
    marginBottom: 20,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  materialIcon: {
    marginRight: 15,
  },
  materialTitle: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.dark,
  },
  enrollButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  enrollButtonText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.white,
  },
});

export default CourseDetailScreen;
