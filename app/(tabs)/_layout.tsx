import { useAtualizarSessao } from '@/contexts/SessaoContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const atualizarSessao = useAtualizarSessao();

  async function logout() {
    await AsyncStorage.setItem('logado', 'false');
    atualizarSessao(false);
  }

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sair</Text>
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