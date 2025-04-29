# Plano de Testes - Aplicativo MundoemCores.com

## 1. Testes de Interface do Usuário

### 1.1 Navegação
- [ ] Verificar navegação entre telas principais (Home, Cursos, Playlists, E-books)
- [ ] Testar navegação de detalhes do curso para player de vídeo
- [ ] Verificar funcionamento dos botões de voltar em todas as telas
- [ ] Testar rolagem e carregamento de conteúdo em listas longas

### 1.2 Componentes Visuais
- [ ] Verificar se as cores da marca estão aplicadas corretamente
- [ ] Testar responsividade em diferentes tamanhos de tela
- [ ] Verificar se os cards de curso exibem informações corretamente
- [ ] Testar exibição de badges (ex: "Gratuito") nos cursos

### 1.3 Formulários e Inputs
- [ ] Testar campos de busca nas telas de cursos e playlists
- [ ] Verificar filtros (ex: "Somente Gratuitos")
- [ ] Testar campos de entrada na configuração do WhatsApp

## 2. Testes de Integração com Vimeo

### 2.1 Reprodução de Vídeo
- [ ] Verificar carregamento de vídeos do Vimeo
- [ ] Testar controles de reprodução (play, pause, volume)
- [ ] Verificar comportamento em caso de erro de carregamento
- [ ] Testar reprodução em tela cheia

### 2.2 Proteção de Conteúdo
- [ ] Verificar se vídeos protegidos mantêm sua proteção
- [ ] Testar acesso a vídeos com base no modelo freemium
- [ ] Verificar se apenas a primeira aula está disponível para não assinantes

## 3. Testes da Assistente Virtual Cora

### 3.1 Interface do Chat
- [ ] Verificar abertura e fechamento do modal de chat
- [ ] Testar envio e recebimento de mensagens
- [ ] Verificar exibição correta do histórico de mensagens
- [ ] Testar indicador de digitação durante processamento

### 3.2 Processamento de Mensagens
- [ ] Verificar respostas para perguntas sobre desenvolvimento infantil
- [ ] Testar respostas para perguntas sobre o aplicativo
- [ ] Verificar respostas para perguntas sobre cursos
- [ ] Testar comportamento com mensagens vazias ou inválidas

### 3.3 Base de Conhecimento
- [ ] Verificar se documentos de exemplo foram carregados corretamente
- [ ] Testar busca de informações na base de conhecimento
- [ ] Verificar categorização de documentos

## 4. Testes de Integração com WhatsApp

### 4.1 Configuração
- [ ] Testar processo de conexão com WhatsApp
- [ ] Verificar validação de número de telefone
- [ ] Testar desconexão do WhatsApp
- [ ] Verificar configurações de notificações

### 4.2 Mensagens
- [ ] Testar envio de mensagem de boas-vindas
- [ ] Verificar envio de mensagem de teste
- [ ] Testar processamento de mensagens recebidas (simulado)
- [ ] Verificar envio de respostas da Cora

## 5. Testes de Desempenho

### 5.1 Carregamento
- [ ] Medir tempo de carregamento inicial do aplicativo
- [ ] Verificar tempo de carregamento entre telas
- [ ] Testar carregamento de listas de cursos com muitos itens
- [ ] Verificar tempo de carregamento de vídeos

### 5.2 Uso de Recursos
- [ ] Monitorar uso de memória durante navegação
- [ ] Verificar consumo de bateria durante reprodução de vídeos
- [ ] Testar comportamento com conexão de internet lenta

## 6. Testes de Compatibilidade

### 6.1 Plataformas
- [ ] Testar em dispositivos iOS (diferentes versões)
- [ ] Verificar em dispositivos Android (diferentes versões)
- [ ] Testar em tablets e dispositivos com telas maiores

### 6.2 Orientação
- [ ] Verificar comportamento em orientação retrato
- [ ] Testar mudança para orientação paisagem
- [ ] Verificar player de vídeo em tela cheia

## 7. Testes de Segurança

### 7.1 Autenticação
- [ ] Verificar processo de login/cadastro
- [ ] Testar recuperação de senha
- [ ] Verificar persistência de sessão

### 7.2 Proteção de Dados
- [ ] Verificar armazenamento seguro de credenciais
- [ ] Testar proteção de informações pessoais
- [ ] Verificar conformidade com políticas de privacidade

## 8. Testes de Acessibilidade

### 8.1 Leitores de Tela
- [ ] Verificar compatibilidade com VoiceOver (iOS)
- [ ] Testar compatibilidade com TalkBack (Android)
- [ ] Verificar descrições de elementos não textuais

### 8.2 Contraste e Tamanho
- [ ] Verificar contraste de cores para legibilidade
- [ ] Testar escalabilidade de texto
- [ ] Verificar tamanho mínimo de elementos interativos

## Procedimento de Teste

1. Para cada item, executar o teste conforme descrito
2. Documentar resultados (Passou/Falhou)
3. Para falhas, registrar:
   - Descrição detalhada do problema
   - Passos para reproduzir
   - Severidade (Crítica, Alta, Média, Baixa)
   - Capturas de tela ou vídeos quando aplicável
4. Priorizar correções com base na severidade
5. Reteste após correções

## Ambiente de Teste

- Dispositivos iOS: iPhone 12, iPhone SE, iPad Pro
- Dispositivos Android: Samsung Galaxy S21, Google Pixel 5, Xiaomi Mi 11
- Versões de SO: iOS 14+, Android 10+
- Condições de rede: Wi-Fi, 4G, 3G, conexão instável
