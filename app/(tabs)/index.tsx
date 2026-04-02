import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Aluno = {
  id: string;
  nome: string;
  pai: string;
  mae: string;
};

export default function HomeScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<{ [data: string]: string[] }>({});

  const dataHoje = getDataHoje();
  const presentesHoje = presencas[dataHoje] || [];

  const router = useRouter();

  // 🔽 carregar dados ao abrir
  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  // 💾 salvar sempre que mudar
  useEffect(() => {
    salvarDados();
  }, [alunos, presencas]);

  async function carregarDados() {
    try {
      const alunosSalvos = await AsyncStorage.getItem('alunos');
      const presencasSalvas = await AsyncStorage.getItem('presencas');

      if (alunosSalvos) setAlunos(JSON.parse(alunosSalvos));
      if (presencasSalvas) setPresencas(JSON.parse(presencasSalvas));
    } catch (error) {
      console.log(error);
    }
  }

  async function salvarDados() {
    try {
      await AsyncStorage.setItem('alunos', JSON.stringify(alunos));
      await AsyncStorage.setItem('presencas', JSON.stringify(presencas));
    } catch (error) {
      console.log(error);
    }
  }

  function marcarPresenca(id: string) {
    const listaHoje = presentesHoje.includes(id)
      ? presentesHoje.filter(i => i !== id)
      : [...presentesHoje, id];

    setPresencas({
      ...presencas,
      [dataHoje]: listaHoje
    });
  }

  function getDataHoje() {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  }

  const presentes = presentesHoje.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>

        {/* CONTADOR */}
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          👥 Presentes: {presentes}
        </Text>

        {/* LISTA */}
        <FlatList
          data={alunos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const estaPresente = presentesHoje.includes(item.id);

            return (
              <TouchableOpacity onPress={() => marcarPresenca(item.id)}>
                <View style={{
                  padding: 12,
                  backgroundColor: estaPresente ? '#d4edda' : '#f1f1f1',
                  marginTop: 8,
                  borderRadius: 8
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {item.nome}
                  </Text>

                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Responsáveis: {item.pai} / {item.mae}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          onPress={() => router.push('/cadastro')}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 20,
            backgroundColor: '#007bff',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5, // Android
            shadowColor: '#000', // iOS
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}