import OpenAI from 'openai';

// Initialize OpenAI client with the Emergent LLM key
const apiKey = process.env.EMERGENT_LLM_KEY;

if (!apiKey) {
  console.error('Missing EMERGENT_LLM_KEY in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export default openai;