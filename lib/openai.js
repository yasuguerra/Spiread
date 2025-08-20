import OpenAI from 'openai';

let openaiInstance = null;

// Create OpenAI client lazily to avoid build-time failures
function createOpenAIClient() {
  if (openaiInstance) {
    return openaiInstance;
  }

  // Check for available API keys
  const emergentKey = process.env.EMERGENT_LLM_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  
  let apiKey = null;
  
  if (openAiKey) {
    apiKey = openAiKey;
  } else if (emergentKey) {
    apiKey = emergentKey;
  } else {
    // During build time or when no keys are available, return a mock client
    // that will throw meaningful errors when actually used
    console.error('Missing EMERGENT_LLM_KEY and OPENAI_API_KEY in environment variables');
    throw new Error('No AI API keys available. Please set OPENAI_API_KEY or EMERGENT_LLM_KEY environment variable.');
  }

  try {
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
    return openaiInstance;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    throw error;
  }
}

// Export a proxy object that creates the client only when needed
const openaiProxy = {
  get chat() {
    return createOpenAIClient().chat;
  },
  get completions() {
    return createOpenAIClient().completions;
  },
  get models() {
    return createOpenAIClient().models;
  },
  get images() {
    return createOpenAIClient().images;
  },
  get audio() {
    return createOpenAIClient().audio;
  },
  get embeddings() {
    return createOpenAIClient().embeddings;
  },
  get files() {
    return createOpenAIClient().files;
  },
  get fineTuning() {
    return createOpenAIClient().fineTuning;
  },
  get moderations() {
    return createOpenAIClient().moderations;
  }
};

export default openaiProxy;