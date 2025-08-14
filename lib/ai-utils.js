import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// Generate a hash for caching
export function generateHash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// Check and update user quota
export async function checkAndUpdateQuota(userId, requestType) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current quota
  const { data: quota, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking quota:', error);
    throw new Error('Failed to check quota');
  }
  
  // If no quota record or last reset was not today, create/reset
  if (!quota || quota.period_start !== today) {
    const { error: upsertError } = await supabase
      .from('ai_usage')
      .upsert({
        user_id: userId,
        calls_used: 1,
        tokens_used: 0,
        period_start: today,
        updated_at: new Date().toISOString()
      });
    
    if (upsertError) {
      console.error('Error resetting quota:', upsertError);
      throw new Error('Failed to reset quota');
    }
    
    return { allowed: true, remaining: getMaxRequests() - 1 };
  }
  
  // Check if quota exceeded
  const maxRequests = getMaxRequests();
  if (quota.calls_used >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  // Update quota
  const { error: updateError } = await supabase
    .from('ai_usage')
    .update({
      calls_used: quota.calls_used + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error updating quota:', updateError);
    throw new Error('Failed to update quota');
  }
  
  return { allowed: true, remaining: maxRequests - (quota.calls_used + 1) };
}

// Update token usage
export async function updateTokenUsage(userId, tokens) {
  const { error } = await supabase
    .from('ai_usage')
    .update({
      tokens_used: tokens,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating token usage:', error);
  }
}

// Get max requests based on configuration
function getMaxRequests() {
  return parseInt(process.env.AI_MAX_CALLS_PER_DAY || '10');
}

// Check cache for existing results
export async function checkCache(inputText, requestType) {
  const inputHash = generateHash(inputText);
  
  const { data, error } = await supabase
    .from('ai_cache')
    .select('*')
    .eq('input_hash', inputHash)
    .eq('request_type', requestType)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking cache:', error);
    return null;
  }
  
  if (data) {
    // Update access count and timestamp
    await supabase
      .from('ai_cache')
      .update({
        access_count: data.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    return data.output_text;
  }
  
  return null;
}

// Save result to cache
export async function saveToCache(inputText, outputText, requestType, tokenCount) {
  const inputHash = generateHash(inputText);
  const cacheKey = `${requestType}_${uuidv4()}`;
  
  const { error } = await supabase
    .from('ai_cache')
    .insert({
      cache_key: cacheKey,
      input_hash: inputHash,
      output_text: outputText,
      request_type: requestType,
      token_count: tokenCount,
      ver: 'v1',
      created_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error saving to cache:', error);
  }
}

// Chunk text for processing
export function chunkText(text, maxChunkSize = 2000) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate local fallback summary
export function generateLocalSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const bullets = sentences.slice(0, 3).map(s => s.trim() + '.');
  
  return {
    bullets,
    abstract: bullets.join(' ')
  };
}

// Generate local fallback questions
export function generateLocalQuestions(text, count = 5) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const questions = [];
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(' ');
    
    if (words.length > 5) {
      const question = `¿Qué se menciona sobre ${words[Math.floor(words.length / 2)]}?`;
      questions.push({
        q: question,
        choices: [
          sentence.substring(0, 50) + '...',
          'No se menciona',
          'Es irrelevante',
          'Otra respuesta'
        ],
        correctIndex: 0,
        explain: 'Basado en el texto proporcionado'
      });
    }
  }
  
  return questions;
}