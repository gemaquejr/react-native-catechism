import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chavePublicavel = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !chavePublicavel) {
    throw new Error('Configure a URL e a chave publicável do Supabase em .env.local.');
}

export const supabase = createClient(url, chavePublicavel, {
    auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});