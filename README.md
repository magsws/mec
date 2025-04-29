# Guia de Implementação do Aplicativo MundoemCores.com

Este documento serve como guia principal para a implementação do aplicativo MundoemCores.com para iOS e Android. Ele fornece uma visão geral do projeto, instruções para configuração do ambiente de desenvolvimento e referências para documentação detalhada de cada componente.

## Visão Geral do Projeto

O aplicativo MundoemCores.com é uma plataforma educacional para pais que oferece:

1. **Acesso a cursos em vídeo** hospedados no Vimeo
2. **Playlists e e-books** sobre educação infantil
3. **Assistente virtual Cora** para responder dúvidas sobre desenvolvimento infantil
4. **Integração com WhatsApp** para interação com a assistente Cora
5. **Modelo freemium** com conteúdos gratuitos e premium

## Estrutura do Pacote

Este pacote contém todos os arquivos e documentação necessários para implementar o aplicativo:

- `/prototipo`: Código-fonte do protótipo do aplicativo em React Native
- `/documentacao`: Documentação técnica detalhada de cada componente
- `/site`: Arquivos do site promocional do aplicativo

## Requisitos Técnicos

### Ambiente de Desenvolvimento

- **Node.js**: v16.x ou superior
- **React Native**: v0.68.x ou superior
- **Firebase**: Última versão
- **Xcode**: Última versão (para iOS)
- **Android Studio**: Última versão (para Android)

### Contas e APIs Necessárias

1. **Conta no Vimeo** com plano Pro ou superior
2. **Conta no Firebase** com plano Blaze
3. **Conta na OpenAI** para a API da assistente Cora
4. **Conta no WhatsApp Business API** para integração com WhatsApp
5. **Conta no Hotmart** para processamento de pagamentos

## Guia de Implementação

### 1. Configuração do Ambiente

```bash
# Clonar o repositório
git clone [URL_DO_REPOSITORIO]

# Instalar dependências
cd mundoemcores
npm install

# Instalar pods (iOS)
cd ios && pod install && cd ..

# Iniciar o aplicativo em modo de desenvolvimento
npm start
```

### 2. Configuração do Firebase

1. Crie um projeto no Firebase Console
2. Adicione aplicativos iOS e Android
3. Baixe os arquivos de configuração (`google-services.json` e `GoogleService-Info.plist`)
4. Coloque os arquivos nas pastas correspondentes do projeto
5. Configure as regras de segurança do Firestore conforme documentação

### 3. Integração com Vimeo

Consulte o documento `/documentacao/guia_integracao_vimeo.md` para instruções detalhadas sobre:
- Configuração da API do Vimeo
- Implementação do player de vídeo
- Proteção de conteúdo

### 4. Implementação da Assistente Cora

Consulte o documento `/documentacao/guia_implementacao_cora.md` para instruções detalhadas sobre:
- Configuração da API da OpenAI
- Implementação da base de conhecimento
- Desenvolvimento da interface de chat

### 5. Integração com WhatsApp

Consulte o documento `/documentacao/guia_integracao_whatsapp.md` para instruções detalhadas sobre:
- Configuração do WhatsApp Business API
- Implementação do webhook
- Desenvolvimento da integração com a Cora

### 6. Implementação do Modelo Freemium

Consulte o documento `/documentacao/guia_implementacao_freemium.md` para instruções detalhadas sobre:
- Configuração do modelo de assinatura
- Integração com Hotmart
- Implementação de controle de acesso

## Identidade Visual

A identidade visual do MundoemCores.com inclui:

- **Cores**:
  - Vermelho: #b72f2f
  - Amarelo: #dec024
  - Verde Claro: #9cac3b
  - Verde Escuro: #367c53
  - Azul: #23364e

- **Fonte**: Nunito e suas variações

- **Logotipo**: Disponível em `/site/images/logo.png`

## Testes

Consulte o documento `/documentacao/plano_de_testes.md` para o plano completo de testes, incluindo:
- Testes de integração com Vimeo
- Testes da assistente Cora
- Testes de integração com WhatsApp
- Testes do modelo freemium

## Publicação

### App Store (iOS)

1. Configure o certificado de distribuição e perfil de provisionamento
2. Atualize as informações do aplicativo no `Info.plist`
3. Gere o arquivo IPA
4. Envie para revisão através do App Store Connect

### Google Play Store (Android)

1. Configure a chave de assinatura
2. Atualize as informações do aplicativo no `build.gradle`
3. Gere o APK assinado ou bundle AAB
4. Envie para revisão através do Google Play Console

## Suporte

Para questões relacionadas à implementação, entre em contato com:
- Email: contato@mundoemcores.com

## Recursos Adicionais

- Análise de tecnologias: `/documentacao/analise_tecnologias.md`
- Manual do usuário: `/documentacao/manual_do_usuario.md`
- Site promocional: Disponível em https://dbtlfjkk.manus.space
