import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
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
  const [presencas, setPresencas] = useState<Record<string, string[]> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const gravacaoEmAndamento = useRef(false);

  const [dataHoje, setDataHoje] = useState(() => getDataHoje());
  const presentesHoje = presencas?.[dataHoje] ?? [];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function atualizarDia() {
      clearTimeout(timer);

      const agora = new Date();
      setDataHoje(getDataHoje(agora));

      const proximaMeiaNoite = new Date(agora);
      proximaMeiaNoite.setHours(24, 0, 0, 0);
      timer = setTimeout(
        atualizarDia,
        proximaMeiaNoite.getTime() - agora.getTime(),
      );
    }

    atualizarDia();

    const subscription = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizarDia();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

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

    const dataDaMarcacao = getDataHoje();
    setDataHoje(dataDaMarcacao);

    const listaDoDia = presencas[dataDaMarcacao] ?? [];
    const listaAtualizada = listaDoDia.includes(id)
      ? listaDoDia.filter((presenteId) => presenteId !== id)
      : [...listaDoDia, id];

    const atualizadas = {
      ...presencas,
      [dataDaMarcacao]: listaAtualizada,
    };

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

  function getDataHoje(hoje = new Date()) {
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
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