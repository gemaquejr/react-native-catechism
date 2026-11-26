import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (sessao === undefined) return null;

  const logado = sessao !== null;

  if (logado === null) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!logado}>
          <Stack.Screen name="login" />
        </Stack.Protected>

        <Stack.Protected guard={logado}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}