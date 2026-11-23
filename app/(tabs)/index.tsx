import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Aluno = {
  id: string;
  nome: string;
  pai: string;
  mae: string;
};

export default function HomeScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, string[]> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const gravacaoEmAndamento = useRef(false);

  const dataHoje = getDataHoje();
  const presentesHoje = presencas?.[dataHoje] ?? [];

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarAlunos() {
        try {
          const dados = await AsyncStorage.getItem('alunos');

          if (ativo) {
            setAlunos(dados === null ? [] : JSON.parse(dados));
          }
        } catch (error) {
          console.error(error);

          if (ativo) {
            Alert.alert('Erro', 'Não foi possível carregar os alunos.');
          }
        }
      }

      void carregarAlunos();

      return () => {
        ativo = false;
      };
    }, []),
  );

  useEffect(() => {
    let ativo = true;

    async function carregarPresencas() {
      try {
        const dados = await AsyncStorage.getItem('presencas');

        if (ativo) {
          setPresencas(dados === null ? {} : JSON.parse(dados));
        }
      } catch (error) {
        console.error(error);

        if (ativo) {
          Alert.alert(
            'Erro ao carregar a chamada',
            'Feche e reabra o app para tentar novamente.',
          );
        }
      }
    }

    void carregarPresencas();

    return () => {
      ativo = false;
    };
  }, []);

  async function marcarPresenca(id: string) {
    if (presencas === null || gravacaoEmAndamento.current) return;

    const listaHoje = presentesHoje.includes(id)
      ? presentesHoje.filter((presenteId) => presenteId !== id)
      : [...presentesHoje, id];

    const atualizadas = { ...presencas, [dataHoje]: listaHoje };

    gravacaoEmAndamento.current = true;
    setSalvando(true);

    try {
      await AsyncStorage.setItem('presencas', JSON.stringify(atualizadas));
      setPresencas(atualizadas);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a presença. Tente novamente.');
    } finally {
      gravacaoEmAndamento.current = false;
      setSalvando(false);
    }
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
              <TouchableOpacity
                disabled={presencas === null || salvando}
                onPress={() => marcarPresenca(item.id)}
              >
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