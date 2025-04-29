import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, FONT, SIZES } from '../assets/theme';
import CourseCard from '../components/CourseCard';
import CoraAssistant from '../components/CoraAssistant';

/**
 * Tela de Cursos do aplicativo MundoemCores.com
 * Exibe a lista completa de cursos disponíveis com opções de filtro
 */
const CoursesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFree, setFilterFree] = useState(false);
  
  // Dados de exemplo para os cursos
  const allCourses = [
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
    {
      id: '4',
      title: 'Educação Montessoriana em Casa',
      description: 'Princípios e práticas do método Montessori que podem ser aplicados no ambiente familiar.',
      thumbnail: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: false,
      progress: 0,
    },
    {
      id: '5',
      title: 'Desenvolvimento da Linguagem',
      description: 'Como estimular o desenvolvimento da linguagem desde os primeiros meses de vida.',
      thumbnail: 'https://images.unsplash.com/photo-1516627145497-ae6968895b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: true,
      progress: 10,
    },
    {
      id: '6',
      title: 'Alimentação Saudável para Crianças',
      description: 'Estratégias para introduzir alimentos saudáveis e lidar com a seletividade alimentar.',
      thumbnail: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      isFree: false,
      progress: 0,
    },
  ];

  // Filtra os cursos com base na pesquisa e no filtro de gratuidade
  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFree = filterFree ? course.isFree : true;
    return matchesSearch && matchesFree;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cursos</Text>
      </View>

      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cursos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filterFree && styles.filterButtonActive
          ]}
          onPress={() => setFilterFree(!filterFree)}
        >
          <Text style={[
            styles.filterButtonText,
            filterFree && styles.filterButtonTextActive
          ]}>
            Somente Gratuitos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de cursos */}
      <FlatList
        data={filteredCourses}
        renderItem={({ item }) => (
          <View style={styles.courseCardContainer}>
            <CourseCard
              title={item.title}
              description={item.description}
              thumbnail={item.thumbnail}
              isFree={item.isFree}
              progress={item.progress}
              onPress={() => navigation ? navigation.navigate('CourseDetail', { courseId: item.id }) : null}
            />
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.coursesList}
        showsVerticalScrollIndicator={false}
      />

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
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xxLarge,
    color: COLORS.white,
  },
  searchContainer: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    marginRight: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  coursesList: {
    padding: 15,
  },
  courseCardContainer: {
    marginBottom: 15,
  },
});

export default CoursesScreen;
