import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null;

// Create Supabase client lazily to avoid build-time failures
function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// Export a proxy object that creates the client only when needed
export const supabase = {
  get auth() {
    return createSupabaseClient().auth;
  },
  get from() {
    return createSupabaseClient().from.bind(createSupabaseClient());
  },
  get storage() {
    return createSupabaseClient().storage;
  },
  get functions() {
    return createSupabaseClient().functions;
  },
  get channel() {
    return createSupabaseClient().channel.bind(createSupabaseClient());
  },
  get removeChannel() {
    return createSupabaseClient().removeChannel.bind(createSupabaseClient());
  },
  get removeAllChannels() {
    return createSupabaseClient().removeAllChannels.bind(createSupabaseClient());
  },
  get getChannels() {
    return createSupabaseClient().getChannels.bind(createSupabaseClient());
  }
};

// Database initialization function
export const initializeDatabase = async () => {
  try {
    // Check if users table exists by trying to select from it
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database initialization error:', error)
    console.log('Please make sure you have created the required tables in Supabase')
  }
}

// User management functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const createAnonymousSession = async () => {
  const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  return sessionId
}

// Reading session functions
export const saveReadingSession = async (userId, sessionData) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        wpm_start: sessionData.wpmStart,
        wpm_end: sessionData.wpmEnd,
        comprehension_score: sessionData.comprehensionScore,
        exercise_type: sessionData.exerciseType,
        duration_seconds: sessionData.durationSeconds,
        text_length: sessionData.textLength,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error saving reading session:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveReadingSession:', error)
    throw error
  }
}

// Document management functions
export const saveDocument = async (userId, documentData) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        title: documentData.title,
        content: documentData.content,
        document_type: documentData.type,
        word_count: documentData.wordCount,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error saving document:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveDocument:', error)
    throw error
  }
}

// Settings functions
export const getUserSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getUserSettings:', error)
    return null
  }
}

export const updateUserSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        wpm_target: settings.wpmTarget,
        chunk_size: settings.chunkSize,
        theme: settings.theme,
        language: settings.language,
        font_size: settings.fontSize,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user settings:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateUserSettings:', error)
    throw error
  }
}