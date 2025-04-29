import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, SIZES, SHADOWS } from '../assets/theme';

/**
 * Componente de Card de Curso
 * Exibe informações resumidas de um curso com imagem, título, descrição e status
 */
const CourseCard = ({ 
  title, 
  description, 
  thumbnail, 
  isFree = false, 
  progress = 0, 
  onPress 
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image 
        source={{ uri: thumbnail }} 
        style={styles.thumbnail}
        resizeMode="cover"
      />
      
      {/* Badge de curso gratuito */}
      {isFree && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>Gratuito</Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        
        {/* Barra de progresso */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progress}% concluído</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  freeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  freeBadgeText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.small,
  },
  infoContainer: {
    padding: 15,
  },
  title: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.dark,
    marginBottom: 5,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.quaternary,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
    marginTop: 5,
  },
});

export default CourseCard;
