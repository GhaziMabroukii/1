// ============ AI PROCESSING SERVICE ============

// Language detection and processing
function detectLanguage(text: string): string {
  // Simple language detection based on character patterns
  const arabicPattern = /[\u0600-\u06FF]/;
  const frenchPattern = /[àâäéèêëïîôöùûüÿç]/i;
  
  if (arabicPattern.test(text)) {
    // Check for Tunisian dialect patterns
    const tunisianWords = ['باهي', 'نحبك', 'برشا', 'مليح', 'كيفاش', 'وقتاش', 'فمة', 'موش'];
    const hasTunisian = tunisianWords.some(word => text.includes(word));
    return hasTunisian ? 'tn' : 'ar';
  }
  
  if (frenchPattern.test(text)) {
    return 'fr';
  }
  
  // Default to French for simplicity
  return 'fr';
}

// Multi-language responses
const responses = {
  greeting: {
    ar: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    fr: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    en: 'Hello! How can I help you today?',
    tn: 'أهلاً وسهلاً! كيفاش نجم نعاونك اليوم؟'
  },
  property_search: {
    ar: 'سأبحث لك عن أفضل العقارات المتاحة.',
    fr: 'Je vais chercher les meilleures propriétés disponibles pour vous.',
    en: 'I\'ll search for the best available properties for you.',
    tn: 'توة نقلبلك على أحسن عقارات موجودين.'
  },
  no_properties: {
    ar: 'عذراً، لم أجد عقارات تطابق معاييرك.',
    fr: 'Désolé, je n\'ai trouvé aucune propriété correspondant à vos critères.',
    en: 'Sorry, I found no properties matching your criteria.',
    tn: 'آسف، ما لقيتش عقارات على حسب طلبك.'
  },
  ask_budget: {
    ar: 'ما هو الميزانية المتاحة لديك؟',
    fr: 'Quel est votre budget disponible ?',
    en: 'What is your available budget?',
    tn: 'قداش الميزانية متاعك؟'
  },
  ask_location: {
    ar: 'في أي منطقة تفضل السكن؟',
    fr: 'Dans quelle zone préférez-vous habiter ?',
    en: 'In which area would you prefer to live?',
    tn: 'في أنهي منطقة تحب تسكن؟'
  },
  property_found: {
    ar: 'وجدت {count} عقار مناسب لك:',
    fr: 'J\'ai trouvé {count} propriété(s) qui vous conviennent :',
    en: 'I found {count} property(ies) suitable for you:',
    tn: 'لقيت {count} عقار مناسب ليك:'
  },
  market_advice: {
    ar: 'نصائح السوق العقاري:',
    fr: 'Conseils du marché immobilier :',
    en: 'Real estate market advice:',
    tn: 'نصائح السوق العقاري:'
  },
  owner_tips: {
    ar: ['حدث صور العقار بانتظام', 'اضبط السعر حسب السوق', 'اكتب وصف مفصل وجذاب', 'رد بسرعة على الاستفسارات'],
    fr: ['Mettez à jour les photos régulièrement', 'Ajustez le prix selon le marché', 'Rédigez une description détaillée et attrayante', 'Répondez rapidement aux demandes'],
    en: ['Update photos regularly', 'Adjust price according to market', 'Write detailed and attractive description', 'Respond quickly to inquiries'],
    tn: ['حدث الصور باستمرار', 'اضبط الثمن على حسب السوق', 'اكتب وصف مفصل ومليح', 'جاوب بسرعة على الاستفسارات']
  },
  tenant_tips: {
    ar: ['حدد ميزانيتك بوضوح', 'زر العقار شخصياً', 'اطلب كل الوثائق اللازمة', 'تفاوض بذكاء'],
    fr: ['Définissez clairement votre budget', 'Visitez la propriété en personne', 'Demandez tous les documents nécessaires', 'Négociez intelligemment'],
    en: ['Define your budget clearly', 'Visit the property in person', 'Request all necessary documents', 'Negotiate smartly'],
    tn: ['حدد ميزانيتك بالضبط', 'زور الدار بروحك', 'اطلب كل الأوراق اللازمة', 'فاوض بذكاء']
  }
};

// Extract search criteria from message
function extractSearchCriteria(message: string, language: string) {
  const criteria: any = {};
  
  // Price extraction
  const pricePatterns = {
    ar: /(\d+)\s*(دينار|دت|د)/,
    fr: /(\d+)\s*(dt|dinars?|euros?)/i,
    en: /(\d+)\s*(dt|dinars?|dollars?)/i,
    tn: /(\d+)\s*(دينار|دت|د)/
  };
  
  const priceMatch = message.match(pricePatterns[language as keyof typeof pricePatterns] || pricePatterns.fr);
  if (priceMatch) {
    criteria.maxPrice = parseInt(priceMatch[1]);
  }
  
  // Location extraction
  const locations = ['tunis', 'sfax', 'sousse', 'bizerte', 'gabes', 'ariana', 'ben arous', 'manouba', 'centre ville', 'lac', 'menzah', 'manar'];
  for (const location of locations) {
    if (message.toLowerCase().includes(location)) {
      criteria.location = location;
      break;
    }
  }
  
  // Property type extraction
  const types = {
    ar: { 'شقة': 'apartment', 'استوديو': 'studio', 'فيلا': 'villa', 'منزل': 'house' },
    fr: { 'appartement': 'apartment', 'studio': 'studio', 'villa': 'villa', 'maison': 'house' },
    en: { 'apartment': 'apartment', 'studio': 'studio', 'villa': 'villa', 'house': 'house' },
    tn: { 'شقة': 'apartment', 'استوديو': 'studio', 'دار': 'house', 'فيلا': 'villa' }
  };
  
  const typeWords = types[language as keyof typeof types] || types.fr;
  for (const [word, type] of Object.entries(typeWords)) {
    if (message.toLowerCase().includes(word.toLowerCase())) {
      criteria.type = type;
      break;
    }
  }
  
  // Rooms extraction
  const roomsPattern = /(\d+)\s*(غرف|غرفة|chambre|room|pièce)/i;
  const roomsMatch = message.match(roomsPattern);
  if (roomsMatch) {
    criteria.rooms = parseInt(roomsMatch[1]);
  }
  
  return criteria;
}

// Generate personalized recommendations
async function generateRecommendations(user: any, userType: string, storage: any, language: string) {
  const recommendations = [];
  
  if (userType === 'tenant') {
    // Get properties and generate smart recommendations
    const allProperties = await storage.getProperties();
    const availableProperties = allProperties.filter((p: any) => p.status === 'Disponible');
    
    // Budget-based recommendations
    const budget = user.preferences?.budget || 500;
    const suitable = availableProperties.filter((p: any) => 
      parseInt(p.price) <= budget * 1.2
    ).slice(0, 3);
    
    if (suitable.length > 0) {
      const messages = {
        ar: `بناءً على تفضيلاتك (ميزانية: ${budget} دت)، أنصحك بهذه العقارات:`,
        fr: `Basé sur vos préférences (budget: ${budget} DT), je vous recommande ces propriétés :`,
        en: `Based on your preferences (budget: ${budget} DT), I recommend these properties:`,
        tn: `على حسب ذوقك (ميزانية: ${budget} دت)، نقترح عليك هاذم العقارات:`
      };
      
      recommendations.push({
        message: messages[language as keyof typeof messages] || messages.fr,
        properties: suitable
      });
    }
    
    // Add tenant tips
    const tipMessage = responses.tenant_tips[language as keyof typeof responses.tenant_tips] || responses.tenant_tips.fr;
    recommendations.push({
      type: 'tips',
      message: 'نصائح للمستأجرين:',
      tips: tipMessage
    });
    
  } else if (userType === 'owner') {
    // Get owner's properties
    const userProperties = await storage.getProperties(user.id);
    
    if (userProperties.length > 0) {
      const messages = {
        ar: `لديك ${userProperties.length} عقار. إليك نصائح لتحسين أدائها:`,
        fr: `Vous avez ${userProperties.length} propriété(s). Voici des conseils pour améliorer leurs performances :`,
        en: `You have ${userProperties.length} property(ies). Here are tips to improve their performance:`,
        tn: `عندك ${userProperties.length} عقار. هاذم نصائح باش تحسن في أدائها:`
      };
      
      recommendations.push({
        message: messages[language as keyof typeof messages] || messages.fr,
        properties: userProperties.slice(0, 2)
      });
    }
    
    // Add owner tips
    const tipMessage = responses.owner_tips[language as keyof typeof responses.owner_tips] || responses.owner_tips.fr;
    recommendations.push({
      type: 'tips',
      message: responses.market_advice[language as keyof typeof responses.market_advice] || responses.market_advice.fr,
      tips: tipMessage
    });
  }
  
  return recommendations;
}

// Analyze user intent from message
function analyzeIntent(message: string, language: string) {
  const lowerMessage = message.toLowerCase();
  
  const intents = {
    search: {
      ar: ['بحث', 'أبحث', 'أريد', 'اريد', 'شقة', 'استوديو', 'منزل', 'ابغي'],
      fr: ['cherche', 'recherche', 'veux', 'appartement', 'studio', 'maison', 'trouve'],
      en: ['search', 'find', 'want', 'apartment', 'studio', 'house', 'looking'],
      tn: ['نقلب', 'نحب', 'شقة', 'استوديو', 'دار', 'نريد']
    },
    greeting: {
      ar: ['مرحبا', 'أهلا', 'سلام', 'صباح', 'مساء'],
      fr: ['bonjour', 'salut', 'bonsoir', 'hello', 'coucou'],
      en: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      tn: ['أهلا', 'مرحبا', 'لاباس', 'صباح', 'مساء']
    },
    budget: {
      ar: ['ميزانية', 'سعر', 'كلفة', 'ثمن'],
      fr: ['budget', 'prix', 'coût', 'tarif'],
      en: ['budget', 'price', 'cost', 'rate'],
      tn: ['ميزانية', 'ثمن', 'كلفة']
    },
    location: {
      ar: ['منطقة', 'مكان', 'موقع', 'أين'],
      fr: ['zone', 'lieu', 'endroit', 'quartier', 'où'],
      en: ['area', 'location', 'place', 'where'],
      tn: ['منطقة', 'بلاصة', 'فين', 'وين']
    },
    advice: {
      ar: ['نصيحة', 'مشورة', 'رأي', 'اقتراح'],
      fr: ['conseil', 'avis', 'suggestion', 'recommandation'],
      en: ['advice', 'tip', 'suggestion', 'recommendation'],
      tn: ['نصيحة', 'مشورة', 'رأي']
    }
  };
  
  for (const [intent, keywords] of Object.entries(intents)) {
    const langKeywords = keywords[language as keyof typeof keywords] || keywords.fr;
    if (langKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return 'general';
}

// Main AI processing function
export async function processAIMessage({ message, user, userType, language, conversationHistory, storage }: any) {
  const detectedLanguage = language === 'auto' ? detectLanguage(message) : language;
  const intent = analyzeIntent(message, detectedLanguage);
  
  console.log(`AI Processing - User: ${user.id}, Intent: ${intent}, Language: ${detectedLanguage}`);
  
  switch (intent) {
    case 'greeting':
      const recommendations = await generateRecommendations(user, userType, storage, detectedLanguage);
      return {
        message: responses.greeting[detectedLanguage as keyof typeof responses.greeting] || responses.greeting.fr,
        language: detectedLanguage,
        recommendations
      };
      
    case 'search':
      const criteria = extractSearchCriteria(message, detectedLanguage);
      console.log('Search criteria:', criteria);
      
      // Search properties in database
      const allProperties = await storage.getProperties();
      let filteredProperties = allProperties.filter((p: any) => p.status === 'Disponible');
      
      // Apply search criteria
      if (criteria.maxPrice) {
        filteredProperties = filteredProperties.filter((p: any) => parseInt(p.price) <= criteria.maxPrice);
      }
      
      if (criteria.location) {
        filteredProperties = filteredProperties.filter((p: any) => 
          p.address.toLowerCase().includes(criteria.location.toLowerCase())
        );
      }
      
      if (criteria.type) {
        filteredProperties = filteredProperties.filter((p: any) => p.type === criteria.type);
      }
      
      if (criteria.rooms) {
        filteredProperties = filteredProperties.filter((p: any) => p.rooms >= criteria.rooms);
      }
      
      // Limit results
      const results = filteredProperties.slice(0, 5);
      
      if (results.length > 0) {
        const countMessage = responses.property_found[detectedLanguage as keyof typeof responses.property_found] || responses.property_found.fr;
        return {
          message: countMessage.replace('{count}', results.length.toString()),
          language: detectedLanguage,
          properties: results.map((p: any) => ({
            id: p.id,
            title: p.title,
            address: p.address,
            price: p.price,
            type: p.type,
            surface: p.surface,
            rooms: p.rooms
          })),
          actions: [
            {
              label: detectedLanguage === 'ar' ? 'المزيد من الخيارات' :
                     detectedLanguage === 'tn' ? 'خيارات أكثر' :
                     detectedLanguage === 'en' ? 'More options' : 'Plus d\'options'
            }
          ]
        };
      } else {
        // No properties found - ask for more details
        const followUp = !criteria.maxPrice ? 
          (responses.ask_budget[detectedLanguage as keyof typeof responses.ask_budget] || responses.ask_budget.fr) :
          !criteria.location ? 
          (responses.ask_location[detectedLanguage as keyof typeof responses.ask_location] || responses.ask_location.fr) :
          (responses.no_properties[detectedLanguage as keyof typeof responses.no_properties] || responses.no_properties.fr);
        
        return {
          message: followUp,
          language: detectedLanguage
        };
      }
      
    case 'budget':
      const budgetMessages = {
        ar: 'يمكنني مساعدتك في تحديد ميزانية مناسبة. الأسعار في تونس تتراوح بين 200-1500 دت للشقق.',
        fr: 'Je peux vous aider à définir un budget approprié. Les prix en Tunisie varient entre 200-1500 DT pour les appartements.',
        en: 'I can help you set an appropriate budget. Prices in Tunisia range from 200-1500 DT for apartments.',
        tn: 'نجم نعاونك تحدد ميزانية مناسبة. الأسعار في تونس تتراوح بين 200-1500 دت للشقق.'
      };
      
      return {
        message: budgetMessages[detectedLanguage as keyof typeof budgetMessages] || budgetMessages.fr,
        language: detectedLanguage
      };
      
    case 'advice':
      const recommendations2 = await generateRecommendations(user, userType, storage, detectedLanguage);
      return {
        message: userType === 'tenant' ? 
          (detectedLanguage === 'ar' ? 'إليك أفضل النصائح للمستأجرين:' :
           detectedLanguage === 'tn' ? 'هاذم أحسن النصائح للمستأجرين:' :
           detectedLanguage === 'en' ? 'Here are the best tips for tenants:' :
           'Voici les meilleurs conseils pour les locataires :') :
          (detectedLanguage === 'ar' ? 'إليك أفضل النصائح لأصحاب العقارات:' :
           detectedLanguage === 'tn' ? 'هاذم أحسن النصائح لأصحاب العقارات:' :
           detectedLanguage === 'en' ? 'Here are the best tips for property owners:' :
           'Voici les meilleurs conseils pour les propriétaires :'),
        language: detectedLanguage,
        recommendations: recommendations2
      };
      
    default:
      // Default response with recommendations
      const recommendations3 = await generateRecommendations(user, userType, storage, detectedLanguage);
      
      const defaultResponses = {
        ar: 'يمكنني مساعدتك في البحث عن عقارات أو إدارة ممتلكاتك. ماذا تحتاج؟',
        fr: 'Je peux vous aider à rechercher des propriétés ou gérer vos biens. Que souhaitez-vous ?',
        en: 'I can help you search for properties or manage your assets. What do you need?',
        tn: 'نجم نعاونك تدور على عقارات ولا تسير في ممتلكاتك. شنوة تحب؟'
      };
      
      return {
        message: defaultResponses[detectedLanguage as keyof typeof defaultResponses] || defaultResponses.fr,
        language: detectedLanguage,
        recommendations: recommendations3
      };
  }
}