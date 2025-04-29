// App.js - Arquivo principal do aplicativo MundoemCores.com

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { COLORS } from './prototipo/assets/theme';

// Importação das telas
import HomeScreen from './prototipo/screens/HomeScreen';
import CoursesScreen from './prototipo/screens/CoursesScreen';
import CourseDetailScreen from './prototipo/screens/CourseDetailScreen';
import VideoPlayerScreen from './prototipo/screens/VideoPlayerScreen';
import WhatsAppSettingsScreen from './prototipo/screens/WhatsAppSettingsScreen';

// Criação dos navegadores
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navegador de Cursos
const CoursesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CoursesList" component={CoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </Stack.Navigator>
  );
};

// Navegador principal
const App = () => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor={COLORS.dark} barStyle="light-content" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.darkGray,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.lightGray,
            paddingBottom: 5,
            paddingTop: 5,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarLabel: 'Início',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Courses" 
          component={CoursesStack} 
          options={{
            tabBarLabel: 'Cursos',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>📚</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Playlists" 
          component={HomeScreen} // Placeholder, seria substituído pela tela real
          options={{
            tabBarLabel: 'Playlists',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🎬</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Ebooks" 
          component={HomeScreen} // Placeholder, seria substituído pela tela real
          options={{
            tabBarLabel: 'E-books',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>📖</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="WhatsApp" 
          component={WhatsAppSettingsScreen}
          options={{
            tabBarLabel: 'WhatsApp',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>💬</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
