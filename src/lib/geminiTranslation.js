import { GoogleGenerativeAI } from '@google/generative-ai';

// Obtener la API key del entorno (compatible con Vite y Node.js)
const getApiKey = () => {
  // En el navegador con Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // En Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return null;
};

// Inicializar Gemini AI con la API key del entorno
const genAI = new GoogleGenerativeAI(getApiKey());

/**
 * Función para esperar un tiempo determinado (delay)
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Función para verificar si un error es temporal (reintentable)
 * @param {Error} error - Error a verificar
 * @returns {boolean} - True si es un error temporal
 */
function isTemporaryError(error) {
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('503') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('temporarily unavailable') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('502') ||
    errorMessage.includes('504')
  );
}

/**
 * Función para verificar si un error es de cuota/tokens agotados (no reintentable)
 * @param {Error} error - Error a verificar
 * @returns {boolean} - True si es un error de cuota agotada
 */
function isQuotaError(error) {
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('insufficient tokens') ||
    errorMessage.includes('billing') ||
    errorMessage.includes('payment required') ||
    errorMessage.includes('free tier') ||
    errorMessage.includes('usage limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('resource_exhausted')
  );
}

/**
 * Función para verificar si un error es de API key inválida (no reintentable)
 * @param {Error} error - Error a verificar
 * @returns {boolean} - True si es un error de API key
 */
function isApiKeyError(error) {
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('api key') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid key') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('401') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('403')
  );
}

/**
 * Función independiente para traducir texto usando Gemini API con sistema de reintentos
 * @param {string} text - Texto a traducir
 * @param {string} targetLanguage - Idioma de destino (por defecto 'English')
 * @param {string} sourceLanguage - Idioma de origen (opcional, se detecta automáticamente)
 * @param {string} context - Contexto adicional para mejorar la traducción (opcional)
 * @param {number} maxRetries - Número máximo de reintentos (por defecto 3)
 * @returns {Promise<string>} - Texto traducido
 */
export async function translateText(text, targetLanguage = 'English', sourceLanguage = null, context = null, maxRetries = 3) {
  // Validar que el texto no esté vacío
  if (!text || text.trim() === '') {
    throw new Error('El texto a traducir no puede estar vacío');
  }

  // Validar que la API key esté configurada
  if (!getApiKey()) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada en las variables de entorno');
  }

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} de traducción...`);
      
      // Obtener el modelo Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Construir el prompt para la traducción
      let prompt = `Translate the following text to ${targetLanguage}`;
      
      if (sourceLanguage) {
        prompt += ` from ${sourceLanguage}`;
      }
      
      if (context) {
        prompt += `. Context: ${context}`;
      }
      
      prompt += `. Only return the translated text, no explanations or additional content:\n\n"${text}"`;

      // Debug logs removidos para limpiar la consola

      // Realizar la traducción
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();

      // Respuesta de Gemini recibida
      
      // Si llegamos aquí, la traducción fue exitosa
      console.log(`✅ Traducción exitosa en intento ${attempt}`);
      
      // Limpiar la respuesta (remover comillas si las hay)
      const cleanedText = translatedText.replace(/^["']|["']$/g, '').trim();
      
      return cleanedText;

    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`, error.message);
      lastError = error;
      
      // Verificar tipo de error para determinar si reintentar
      if (isQuotaError(error)) {
        console.error(`🚫 Error de cuota/tokens agotados - No reintentable`);
        throw new Error(`Cuota de traducción agotada: ${error.message}`);
      }
      
      if (isApiKeyError(error)) {
        console.error(`🚫 Error de API key - No reintentable`);
        throw new Error(`Error de autenticación API: ${error.message}`);
      }
      
      // Si no es un error temporal o es el último intento, lanzar el error
      if (!isTemporaryError(error) || attempt === maxRetries) {
        console.error(`🚫 Error permanente o máximo de reintentos alcanzado`);
        throw new Error(`Error al traducir el texto: ${error.message}`);
      }
      
      // Calcular delay exponencial: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Esperando ${delayMs/1000}s antes del siguiente intento...`);
      
      await delay(delayMs);
    }
  }
  
  // Este punto no debería alcanzarse, pero por seguridad
  throw new Error(`Error al traducir el texto después de ${maxRetries} intentos: ${lastError?.message}`);
}

/**
 * Función específica para traducir categorías de servicios al inglés
 * @param {Object} categoryData - Datos de la categoría a traducir
 * @param {string} categoryData.title_part1 - Primera parte del título
 * @param {string} categoryData.title_part2 - Segunda parte del título
 * @param {string} categoryData.subtitle - Subtítulo de la categoría
 * @returns {Promise<Object>} - Objeto con las traducciones al inglés
 */
export async function translateCategoryToEnglish(categoryData) {
  try {
    console.log('Iniciando traducción para:', categoryData);
    
    const context = 'This is a service category for a business services platform. Translate each field maintaining the professional tone and business context.';
    
    // Traducir cada campo por separado
    const [translatedTitlePart1, translatedTitlePart2, translatedSubtitle] = await Promise.all([
      translateText(categoryData.title_part1, 'English', null, context + ' This is the first part of a business service category title.'),
      translateText(categoryData.title_part2, 'English', null, context + ' This is the second part of a business service category title.'),
      translateText(categoryData.subtitle, 'English', null, context + ' This is a subtitle describing the service category.')
    ]);
    
    const translations = {
      en: {
        title_part1: translatedTitlePart1.toUpperCase(),
        title_part2: translatedTitlePart2.toUpperCase(),
        subtitle: translatedSubtitle.toUpperCase()
      },
      manually_edited: false
    };
    
    console.log('Traducción completada:', translations);
    return translations;
    
  } catch (error) {
    console.error('Error al traducir categoría:', error);
    throw error;
  }
}

/**
 * Función para traducir múltiples textos en lote
 * @param {string[]} texts - Array de textos a traducir
 * @param {string} targetLanguage - Idioma de destino
 * @param {string} context - Contexto para las traducciones
 * @returns {Promise<string[]>} - Array de textos traducidos
 */
export async function translateBatch(texts, targetLanguage = 'English', context = null) {
  try {
    const translations = await Promise.all(
      texts.map(text => translateText(text, targetLanguage, null, context))
    );
    return translations;
  } catch (error) {
    console.error('Error en traducción por lotes:', error);
    throw error;
  }
}

/**
 * Función para detectar el idioma de un texto con sistema de reintentos
 * @param {string} text - Texto para detectar idioma
 * @param {number} maxRetries - Número máximo de reintentos (por defecto 3)
 * @returns {Promise<string>} - Idioma detectado
 */
export async function detectLanguage(text, maxRetries = 3) {
  if (!text || text.trim() === '') {
    throw new Error('El texto no puede estar vacío');
  }

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} de detección de idioma...`);
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Detect the language of the following text and return only the language name in English (e.g., "Spanish", "English", "French"):\n\n"${text}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const detectedLanguage = response.text().trim();
      
      console.log(`✅ Detección de idioma exitosa en intento ${attempt}`);
      return detectedLanguage.replace(/^["']|["']$/g, '');
      
    } catch (error) {
      console.error(`❌ Error en intento ${attempt} de detección:`, error.message);
      lastError = error;
      
      // Verificar tipo de error para determinar si reintentar
      if (isQuotaError(error)) {
        console.error(`🚫 Error de cuota/tokens agotados en detección - No reintentable`);
        throw new Error(`Cuota de detección agotada: ${error.message}`);
      }
      
      if (isApiKeyError(error)) {
        console.error(`🚫 Error de API key en detección - No reintentable`);
        throw new Error(`Error de autenticación API en detección: ${error.message}`);
      }
      
      // Si no es un error temporal o es el último intento, lanzar el error
      if (!isTemporaryError(error) || attempt === maxRetries) {
        console.error(`🚫 Error permanente o máximo de reintentos alcanzado en detección`);
        throw new Error(`Error al detectar el idioma: ${error.message}`);
      }
      
      // Calcular delay exponencial: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Esperando ${delayMs/1000}s antes del siguiente intento de detección...`);
      
      await delay(delayMs);
    }
  }
  
  throw new Error(`Error al detectar el idioma después de ${maxRetries} intentos: ${lastError?.message}`);
}

export default {
  translateText,
  translateCategoryToEnglish,
  translateBatch,
  detectLanguage
};