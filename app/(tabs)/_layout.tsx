import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const [erroSaida, setErroSaida] = useState('');

  async function logout() {
    setErroSaida('');

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) throw error;
    } catch {
      setErroSaida('Não foi possível sair. Tente novamente.');
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{erroSaida || 'Sair'}</Text>
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: '#007bff' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#007bff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chamada do Dia',
          tabBarLabel: 'Chamada',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cadastro"
        options={{
          title: 'Cadastro',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen name="turmas" options={{ title: 'Turmas' }} />
    </Tabs>
  );
}