import { SessaoContext } from '@/contexts/SessaoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    verificarLogin();
  }, []);

  async function verificarLogin() {
    const status = await AsyncStorage.getItem('logado');
    setLogado(status === 'true');
  }

  if (logado === null) return null;

  return (
    <SessaoContext.Provider value={setLogado}>
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
    </SessaoContext.Provider>
  );
}