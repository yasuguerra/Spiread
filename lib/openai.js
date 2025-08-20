import OpenAI from 'openai';

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    // Initialize OpenAI client with the Emergent LLM key
    const apiKey = process.env.EMERGENT_LLM_KEY;

    if (!apiKey) {
      console.error('Missing EMERGENT_LLM_KEY in environment variables');
      throw new Error('EMERGENT_LLM_KEY environment variable is required');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiClient;
}

export default getOpenAI;