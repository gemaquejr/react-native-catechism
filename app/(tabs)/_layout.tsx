import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Chamada',
        }}
      />

      <Tabs.Screen
        name="cadastro"
        options={{
          title: 'Cadastro',
        }}
      />

    </Tabs>
  );
}