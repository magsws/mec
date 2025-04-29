import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, FONT, SIZES } from '../assets/theme';
import CourseCard from '../components/CourseCard';
import CoraAssistant from '../components/CoraAssistant';

/**
 * Tela Home do aplicativo MundoemCores.com
 * Exibe as categorias principais e conteúdos em destaque
 */
const HomeScreen = ({ navigation }) => {
  // Dados de exemplo para os cursos
  const featuredCourses = [
    {
      id: '1',
      title: 'Desenvolvimento Infantil: Primeiros Anos',
      description: 'Aprenda como estimular o desenvolvimento cognitivo nos primeiros anos de vida.',
      thumbnail: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: true,
      progress: 0,
    },
    {
      id: '2',
      title: 'Comunicação Não-Violenta com Crianças',
      description: 'Técnicas e estratégias para uma comunicação efetiva e amorosa com seus filhos.',
      thumbnail: 'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: false,
      progress: 45,
    },
    {
      id: '3',
      title: 'Limites e Disciplina Positiva',
      description: 'Como estabelecer limites saudáveis utilizando a abordagem da disciplina positiva.',
      thumbnail: 'https://images.unsplash.com/photo-1544776193-0dd2b5033f1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: false,
      progress: 0,
    },
  ];

  // Dados de exemplo para playlists
  const featuredPlaylists = [
    {
      id: '1',
      title: 'Desenvolvimento Cerebral',
      description: 'Série de vídeos sobre como o cérebro infantil se desenvolve.',
      thumbnail: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: false,
      progress: 20,
    },
    {
      id: '2',
      title: 'Educação Emocional',
      description: 'Como ajudar seu filho a identificar e lidar com suas emoções.',
      thumbnail: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: true,
      progress: 0,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Olá, Bem-vindo(a)!</Text>
          <Text style={styles.headerTitle}>MundoemCores</Text>
        </View>

        {/* Categorias */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.categoriesRow}>
            <TouchableOpacity 
              style={[styles.categoryButton, { backgroundColor: COLORS.primary }]}
              onPress={() => navigation ? navigation.navigate('Courses') : null}
            >
              <Text style={styles.categoryText}>Cursos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryButton, { backgroundColor: COLORS.secondary }]}
              onPress={() => navigation ? navigation.navigate('Playlists') : null}
            >
              <Text style={styles.categoryText}>Playlists</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoryButton, { backgroundColor: COLORS.tertiary }]}
              onPress={() => navigation ? navigation.navigate('Ebooks') : null}
            >
              <Text style={styles.categoryText}>E-books</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cursos em Destaque */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cursos em Destaque</Text>
            <TouchableOpacity onPress={() => navigation ? navigation.navigate('Courses') : null}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {featuredCourses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
              thumbnail={course.thumbnail}
              isFree={course.isFree}
              progress={course.progress}
              onPress={() => navigation ? navigation.navigate('CourseDetail', { courseId: course.id }) : null}
            />
          ))}
        </View>

        {/* Playlists em Destaque */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Playlists em Destaque</Text>
            <TouchableOpacity onPress={() => navigation ? navigation.navigate('Playlists') : null}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {featuredPlaylists.map((playlist) => (
            <CourseCard
              key={playlist.id}
              title={playlist.title}
              description={playlist.description}
              thumbnail={playlist.thumbnail}
              isFree={playlist.isFree}
              progress={playlist.progress}
              onPress={() => navigation ? navigation.navigate('PlaylistDetail', { playlistId: playlist.id }) : null}
            />
          ))}
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
    backgroundColor: COLORS.gray,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.dark,
  },
  welcomeText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.white,
    marginBottom: 5,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xxLarge,
    color: COLORS.white,
  },
  categoriesContainer: {
    padding: 20,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.dark,
  },
  seeAllText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
});

export default HomeScreen;
