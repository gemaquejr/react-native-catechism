import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { listarMatriculas } from '@/storage/matriculas';

type Aluno = {
  id: string;
  nome: string;
  pai: string;
  mae: string;
};

type Turma = {
  id: string;
  nome: string;
};

const CHAVE_PRESENCAS_POR_TURMA = 'presencasPorTurma';

export default function HomeScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, string[]> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const gravacaoEmAndamento = useRef(false);

  const [dataHoje, setDataHoje] = useState(() => getDataHoje());
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<
    Awaited<ReturnType<typeof listarMatriculas>>
  >([]);

  const turmaSelecionada = turmas.find((turma) => turma.id === turmaId);
  const alunosDaTurma = turmaSelecionada
    ? alunos.filter((aluno) =>
      matriculas.some(
        (matricula) =>
          matricula.turmaId === turmaSelecionada.id &&
          matricula.alunoId === aluno.id,
      ),
    )
    : [];

  const presentesHoje = turmaSelecionada
    ? presencas?.[`${turmaSelecionada.id}:${dataHoje}`] ?? []
    : [];

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
          const [dadosAlunos, dadosTurmas, matriculasSalvas] = await Promise.all([
            AsyncStorage.getItem('alunos'),
            AsyncStorage.getItem('turmas'),
            listarMatriculas(),
          ]);

          if (ativo) {
            setAlunos(dadosAlunos === null ? [] : JSON.parse(dadosAlunos));
            setTurmas(dadosTurmas === null ? [] : JSON.parse(dadosTurmas));
            setMatriculas(matriculasSalvas);
          }
        } catch (error) {
          console.error(error);
          if (ativo) {
            Alert.alert('Erro', 'Não foi possível carregar as turmas e os alunos.');
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
        const dados = await AsyncStorage.getItem(CHAVE_PRESENCAS_POR_TURMA);

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
    if (!turmaSelecionada || presencas === null || gravacaoEmAndamento.current) {
      return;
    }

    const dataDaMarcacao = getDataHoje();
    setDataHoje(dataDaMarcacao);

    const chaveDaChamada = `${turmaSelecionada.id}:${dataDaMarcacao}`;
    const listaDoDia = presencas[chaveDaChamada] ?? [];

    const listaAtualizada = listaDoDia.includes(id)
      ? listaDoDia.filter((presenteId) => presenteId !== id)
      : [...listaDoDia, id];

    const atualizadas = {
      ...presencas,
      [chaveDaChamada]: listaAtualizada,
    };

    gravacaoEmAndamento.current = true;
    setSalvando(true);

    try {
      await AsyncStorage.setItem(
        CHAVE_PRESENCAS_POR_TURMA,
        JSON.stringify(atualizadas),
      );
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

  const presentes = alunosDaTurma.filter((aluno) => presentesHoje.includes(aluno.id)).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>

        <Text>Selecione a turma da chamada</Text>
        {turmas.map((turma) => (
          <Button
            key={turma.id}
            title={turma.id === turmaId ? `Selecionada: ${turma.nome}` : turma.nome}
            onPress={() => setTurmaId(turma.id)}
          />
        ))}

        {/* CONTADOR */}
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          👥 Presentes: {presentes}
        </Text>

        {/* LISTA */}
        <FlatList
          data={alunosDaTurma}
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