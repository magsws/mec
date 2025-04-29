/**
 * Tela de Configurações do WhatsApp
 * Permite ao usuário configurar a integração da Cora com o WhatsApp
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { COLORS, FONT, SIZES } from '../assets/theme';
import CoraAssistant from '../components/CoraAssistant';
import coraWhatsAppIntegration from '../services/whatsapp/coraWhatsAppIntegration';

const WhatsAppSettingsScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Função para conectar o WhatsApp
  const connectWhatsApp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Erro', 'Por favor, insira um número de telefone válido');
      return;
    }

    setLoading(true);

    try {
      // Em uma implementação real, isso enviaria um código de verificação
      // e iniciaria o processo de conexão com o WhatsApp Business API
      
      // Simulação de conexão bem-sucedida
      setTimeout(() => {
        setConnected(true);
        setLoading(false);
        
        // Envia mensagem de boas-vindas
        coraWhatsAppIntegration.sendWelcomeMessage(phoneNumber, userName)
          .then(result => {
            if (result.success) {
              Alert.alert(
                'Sucesso', 
                'WhatsApp conectado com sucesso! A Cora enviou uma mensagem de boas-vindas para o seu número.'
              );
            }
          })
          .catch(error => {
            console.error('Erro ao enviar mensagem de boas-vindas:', error);
          });
      }, 2000);
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível conectar ao WhatsApp. Por favor, tente novamente mais tarde.');
    }
  };

  // Função para desconectar o WhatsApp
  const disconnectWhatsApp = () => {
    Alert.alert(
      'Desconectar WhatsApp',
      'Tem certeza que deseja desconectar a Cora do seu WhatsApp?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desconectar',
          onPress: () => {
            setLoading(true);
            
            // Em uma implementação real, isso desconectaria da API do WhatsApp
            
            // Simulação de desconexão
            setTimeout(() => {
              setConnected(false);
              setLoading(false);
              Alert.alert('Sucesso', 'WhatsApp desconectado com sucesso');
            }, 1000);
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Função para enviar mensagem de teste
  const sendTestMessage = async () => {
    if (!connected) {
      Alert.alert('Erro', 'Você precisa conectar o WhatsApp primeiro');
      return;
    }

    setLoading(true);

    try {
      const result = await coraWhatsAppIntegration.sendProactiveMessage(
        phoneNumber,
        'Esta é uma mensagem de teste da Cora. Se você está recebendo esta mensagem, a integração com o WhatsApp está funcionando corretamente!'
      );

      setLoading(false);

      if (result.success) {
        Alert.alert('Sucesso', 'Mensagem de teste enviada com sucesso');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar a mensagem de teste');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem de teste');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações do WhatsApp</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conectar a Cora ao WhatsApp</Text>
          <Text style={styles.description}>
            Conecte a assistente Cora ao seu WhatsApp para receber suporte e notificações diretamente no seu celular.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 11999999999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!connected}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Seu Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Como a Cora deve te chamar"
              value={userName}
              onChangeText={setUserName}
              editable={!connected}
            />
          </View>

          {!connected ? (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={connectWhatsApp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Conectando...' : 'Conectar WhatsApp'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.connectedStatus}>
                <Text style={styles.connectedText}>WhatsApp Conectado</Text>
                <View style={styles.statusDot} />
              </View>
              
              <TouchableOpacity
                style={[styles.button, styles.disconnectButton, loading && styles.buttonDisabled]}
                onPress={disconnectWhatsApp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Desconectando...' : 'Desconectar WhatsApp'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.testButton, loading && styles.buttonDisabled]}
                onPress={sendTestMessage}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Enviar Mensagem de Teste</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {connected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferências de Notificação</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Receber notificações no WhatsApp</Text>
              <Switch
                trackColor={{ false: COLORS.lightGray, true: COLORS.tertiary }}
                thumbColor={notificationsEnabled ? COLORS.white : COLORS.white}
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Notificações de novos cursos</Text>
              <Switch
                trackColor={{ false: COLORS.lightGray, true: COLORS.tertiary }}
                thumbColor={true ? COLORS.white : COLORS.white}
                value={true}
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Lembretes de cursos</Text>
              <Switch
                trackColor={{ false: COLORS.lightGray, true: COLORS.tertiary }}
                thumbColor={true ? COLORS.white : COLORS.white}
                value={true}
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Dicas educacionais</Text>
              <Switch
                trackColor={{ false: COLORS.lightGray, true: COLORS.tertiary }}
                thumbColor={true ? COLORS.white : COLORS.white}
                value={true}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre a Integração</Text>
          <Text style={styles.description}>
            A integração com o WhatsApp permite que você converse com a Cora diretamente pelo WhatsApp, receba notificações sobre novos cursos, lembretes para continuar seus estudos e dicas educacionais personalizadas.
          </Text>
          <Text style={styles.description}>
            Todas as mensagens são processadas com segurança e suas informações de contato são mantidas em sigilo conforme nossa política de privacidade.
          </Text>
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
  scrollView: {
    flex: 1,
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
  section: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.large,
    color: COLORS.dark,
    marginBottom: 10,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.darkGray,
    marginBottom: 20,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.dark,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  disconnectButton: {
    backgroundColor: '#E53935',
  },
  testButton: {
    backgroundColor: COLORS.quaternary,
    marginTop: 10,
  },
  buttonText: {
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  connectedText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    color: COLORS.quaternary,
    marginRight: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.quaternary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  switchLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.medium,
    color: COLORS.dark,
  },
});

export default WhatsAppSettingsScreen;
