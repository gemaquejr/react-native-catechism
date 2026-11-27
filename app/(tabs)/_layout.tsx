import { AcessoAdminContext } from '@/lib/acessoContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { useContext, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const [erroSaida, setErroSaida] = useState('');
  const podeAdministrar = useContext(AcessoAdminContext);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 15 }}>
            {podeAdministrar ? (
              <Link href="/solicitacoes-acesso" style={{ color: '#fff', fontWeight: 'bold' }}>
                Solicitações
              </Link>
            ) : null}

            <TouchableOpacity onPress={logout}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {erroSaida || 'Sair'}
              </Text>
            </TouchableOpacity>
          </View>
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