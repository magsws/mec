/**
 * Componente de Gerenciamento de Conhecimento da Cora
 * Responsável por processar e indexar documentos para treinamento da assistente
 */

class CoraKnowledgeManager {
  constructor() {
    // Em uma implementação real, isso seria conectado a um banco de dados
    this.knowledgeBase = {
      categories: [
        {
          id: 'desenvolvimento_infantil',
          name: 'Desenvolvimento Infantil',
          documents: []
        },
        {
          id: 'educacao_positiva',
          name: 'Educação Positiva',
          documents: []
        },
        {
          id: 'comunicacao_nao_violenta',
          name: 'Comunicação Não-Violenta',
          documents: []
        },
        {
          id: 'app_faq',
          name: 'Perguntas Frequentes sobre o App',
          documents: []
        }
      ],
      documents: []
    };
  }

  /**
   * Adiciona um documento à base de conhecimento
   * @param {Object} document - Documento a ser adicionado
   * @param {string} document.title - Título do documento
   * @param {string} document.content - Conteúdo do documento
   * @param {string} document.source - Fonte do documento (ex: "Harvard CDC")
   * @param {string} document.categoryId - ID da categoria
   * @returns {string} - ID do documento adicionado
   */
  addDocument(document) {
    const documentId = `doc_${Date.now()}`;
    
    const newDocument = {
      id: documentId,
      title: document.title,
      content: document.content,
      source: document.source,
      categoryId: document.categoryId,
      dateAdded: new Date(),
      processed: false
    };
    
    this.knowledgeBase.documents.push(newDocument);
    
    // Adiciona o documento à categoria correspondente
    const category = this.knowledgeBase.categories.find(cat => cat.id === document.categoryId);
    if (category) {
      category.documents.push(documentId);
    }
    
    return documentId;
  }

  /**
   * Processa documentos para treinamento
   * @returns {Promise<Array>} - Array de documentos processados
   */
  async processDocuments() {
    try {
      // Encontra documentos não processados
      const unprocessedDocs = this.knowledgeBase.documents.filter(doc => !doc.processed);
      
      // Em uma implementação real, isso processaria os documentos para extração de informações,
      // vetorização de texto, etc.
      
      // Marca os documentos como processados
      unprocessedDocs.forEach(doc => {
        const index = this.knowledgeBase.documents.findIndex(d => d.id === doc.id);
        if (index !== -1) {
          this.knowledgeBase.documents[index].processed = true;
        }
      });
      
      return unprocessedDocs;
    } catch (error) {
      console.error('Erro ao processar documentos:', error);
      return [];
    }
  }

  /**
   * Busca documentos na base de conhecimento
   * @param {string} query - Termo de busca
   * @param {string} categoryId - ID da categoria (opcional)
   * @returns {Array} - Documentos encontrados
   */
  searchDocuments(query, categoryId = null) {
    const lowerQuery = query.toLowerCase();
    
    let filteredDocs = this.knowledgeBase.documents;
    
    // Filtra por categoria se especificada
    if (categoryId) {
      filteredDocs = filteredDocs.filter(doc => doc.categoryId === categoryId);
    }
    
    // Busca por correspondência no título ou conteúdo
    return filteredDocs.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) || 
      doc.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Adiciona documentos de exemplo à base de conhecimento
   */
  addSampleDocuments() {
    // Documentos de exemplo do Center of Developing Child de Harvard
    this.addDocument({
      title: 'Desenvolvimento Cerebral nos Primeiros Anos',
      content: 'Nos primeiros anos de vida, mais de um milhão de novas conexões neurais são formadas a cada segundo. O desenvolvimento cerebral inicial estabelece a base para toda a aprendizagem, saúde e comportamento futuros. As experiências nos primeiros anos afetam a arquitetura do cérebro em desenvolvimento.',
      source: 'Center of Developing Child - Harvard',
      categoryId: 'desenvolvimento_infantil'
    });
    
    this.addDocument({
      title: 'Serve and Return: Interações Responsivas',
      content: 'As interações "serve and return" (servir e retornar) entre crianças e adultos são fundamentais para o desenvolvimento cerebral. Quando um bebê ou criança balbucia, gesticula ou chora, e um adulto responde de forma adequada com contato visual, palavras ou um abraço, conexões neurais são construídas e fortalecidas no cérebro da criança.',
      source: 'Center of Developing Child - Harvard',
      categoryId: 'desenvolvimento_infantil'
    });
    
    this.addDocument({
      title: 'Estresse Tóxico e Desenvolvimento Infantil',
      content: 'O estresse tóxico prejudica o desenvolvimento de conexões neurais, especialmente nas áreas do cérebro dedicadas à aprendizagem e ao raciocínio. A ativação prolongada dos sistemas de resposta ao estresse pode interromper o desenvolvimento de arquitetura cerebral e outros sistemas de órgãos, aumentando o risco de doenças relacionadas ao estresse e comprometimento cognitivo.',
      source: 'Center of Developing Child - Harvard',
      categoryId: 'desenvolvimento_infantil'
    });
    
    // Documentos sobre educação positiva
    this.addDocument({
      title: 'Princípios da Disciplina Positiva',
      content: 'A disciplina positiva é baseada no respeito mútuo e na colaboração. Ela ensina habilidades sociais e de vida de forma encorajadora, não punitiva. Os princípios incluem: ser gentil e firme ao mesmo tempo, conectar-se antes de corrigir, focar em soluções em vez de punições, e valorizar o erro como oportunidade de aprendizado.',
      source: 'MundoemCores.com',
      categoryId: 'educacao_positiva'
    });
    
    // Documentos sobre comunicação não-violenta
    this.addDocument({
      title: 'Comunicação Não-Violenta com Crianças',
      content: 'A comunicação não-violenta (CNV) com crianças envolve observar sem julgar, expressar sentimentos, identificar necessidades e fazer pedidos claros. Ao praticar a CNV, os pais podem criar um ambiente de compreensão mútua e respeito, reduzindo conflitos e fortalecendo o vínculo com os filhos.',
      source: 'MundoemCores.com',
      categoryId: 'comunicacao_nao_violenta'
    });
    
    // FAQs sobre o aplicativo
    this.addDocument({
      title: 'Como acessar os cursos no aplicativo?',
      content: 'Para acessar os cursos no aplicativo MundoemCores.com, faça login com suas credenciais e navegue até a seção "Cursos". Você pode filtrar por categorias ou usar a barra de pesquisa para encontrar temas específicos. Os cursos marcados como "Gratuito" podem ser acessados sem assinatura, enquanto os demais requerem um plano ativo.',
      source: 'MundoemCores.com FAQ',
      categoryId: 'app_faq'
    });
    
    this.addDocument({
      title: 'Como funciona o modelo freemium?',
      content: 'No modelo freemium do MundoemCores.com, você pode se cadastrar gratuitamente e ter acesso a alguns conteúdos selecionados e à primeira aula de cada curso. Para acessar o conteúdo completo, é necessário adquirir uma assinatura através da plataforma Hotmart. As assinaturas estão disponíveis em planos mensais ou anuais.',
      source: 'MundoemCores.com FAQ',
      categoryId: 'app_faq'
    });
  }

  /**
   * Obtém estatísticas da base de conhecimento
   * @returns {Object} - Estatísticas
   */
  getStats() {
    return {
      totalDocuments: this.knowledgeBase.documents.length,
      categoriesCount: this.knowledgeBase.categories.length,
      processedDocuments: this.knowledgeBase.documents.filter(doc => doc.processed).length,
      documentsByCategory: this.knowledgeBase.categories.map(cat => ({
        category: cat.name,
        count: cat.documents.length
      }))
    };
  }
}

export default new CoraKnowledgeManager();
