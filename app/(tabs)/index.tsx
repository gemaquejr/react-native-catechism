import { useArmazenamentoLocal } from '@/lib/armazenamentoLocal';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { listarEncontros } from '@/storage/encontros';
import { listarMatriculas } from '@/storage/matriculas';
import { horariosSeSobrepoem } from '@/utils/horarios';

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

const CHAVE_PRESENCAS_POR_ENCONTRO = 'presencasPorEncontro';

export default function HomeScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, string[]> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const gravacaoEmAndamento = useRef(false);
  const [usuario, setUsuario] = useState('');

  const [encontros, setEncontros] = useState<
    Awaited<ReturnType<typeof listarEncontros>>
  >([]);
  const [encontroId, setEncontroId] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<
    Awaited<ReturnType<typeof listarMatriculas>>
  >([]);
  const [mensagemPresenca, setMensagemPresenca] = useState('');

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

  const encontrosDaTurma = encontros.filter(
    (encontro) => encontro.turmaId === turmaSelecionada?.id,
  );
  const encontroSelecionado = encontrosDaTurma.find(
    (encontro) => encontro.id === encontroId,
  );
  const presentesNoEncontro = encontroSelecionado
    ? presencas?.[encontroSelecionado.id] ?? []
    : [];

  const router = useRouter();
  const armazenamentoLocal = useArmazenamentoLocal();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarAlunos() {
        try {
          const [dadosAlunos, dadosTurmas, matriculasSalvas, encontrosSalvos] = await Promise.all([
            armazenamentoLocal.getItem('alunos'),
            armazenamentoLocal.getItem('turmas'),
            listarMatriculas(armazenamentoLocal),
            listarEncontros(armazenamentoLocal),
          ]);

          if (ativo) {
            setAlunos(dadosAlunos === null ? [] : JSON.parse(dadosAlunos));
            setTurmas(dadosTurmas === null ? [] : JSON.parse(dadosTurmas));
            setMatriculas(matriculasSalvas);
            setEncontros(encontrosSalvos);
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
    }, [armazenamentoLocal]),
  );

  useEffect(() => {
    let ativo = true;

    async function carregarPresencas() {
      try {
        const dados = await armazenamentoLocal.getItem(CHAVE_PRESENCAS_POR_ENCONTRO);

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

    async function carregarUsuario() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const conta = data.session?.user;
        const nome = conta?.user_metadata?.nome;

        if (ativo) {
          setUsuario(
            typeof nome === 'string' && nome.trim()
              ? nome
              : conta?.email ?? '',
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    void carregarPresencas();
    void carregarUsuario();

    return () => {
      ativo = false;
    };
  }, [armazenamentoLocal]);

  async function marcarPresenca(id: string) {
    if (!encontroSelecionado || presencas === null || gravacaoEmAndamento.current) {
      return;
    }

    const chaveDaChamada = encontroSelecionado.id;
    const listaDoDia = presencas[chaveDaChamada] ?? [];

    setMensagemPresenca('');

    const jaEstaPresente = listaDoDia.includes(id);

    if (!jaEstaPresente) {
      const encontroEmConflito = encontros.find(
        (outroEncontro) =>
          outroEncontro.turmaId !== encontroSelecionado.turmaId &&
          outroEncontro.data === encontroSelecionado.data &&
          presencas[outroEncontro.id]?.includes(id) &&
          horariosSeSobrepoem(outroEncontro, encontroSelecionado),
      );

      if (encontroEmConflito) {
        const outraTurma = turmas.find(
          (turma) => turma.id === encontroEmConflito.turmaId,
        );
        const nomeTurma = outraTurma?.nome ?? 'outra turma';

        setMensagemPresenca(
          `O aluno já está presente em um encontro de ${nomeTurma} com horário sobreposto.`,
        );
        return;
      }
    }

    const listaAtualizada = jaEstaPresente
      ? listaDoDia.filter((presenteId) => presenteId !== id)
      : [...listaDoDia, id];

    const atualizadas = {
      ...presencas,
      [chaveDaChamada]: listaAtualizada,
    };

    gravacaoEmAndamento.current = true;
    setSalvando(true);

    try {
      await armazenamentoLocal.setItem(
        CHAVE_PRESENCAS_POR_ENCONTRO,
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

  const presentes = alunosDaTurma.filter((aluno) => presentesNoEncontro.includes(aluno.id)).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>

        <Text style={{ fontSize: 14, color: '#666' }}>
          👤 {usuario}
        </Text>

        <Text>Selecione a turma da chamada</Text>
        {turmas.map((turma) => (
          <Button
            key={turma.id}
            title={turma.id === turmaId ? `Selecionada: ${turma.nome}` : turma.nome}
            onPress={() => {
              setTurmaId(turma.id);
              setEncontroId(null);
              setMensagemPresenca('');
            }}
          />
        ))}

        {turmaSelecionada && encontrosDaTurma.length === 0 ? (
          <Text>Nenhum encontro cadastrado para esta turma.</Text>
        ) : null}

        {encontrosDaTurma.map((encontro) => {
          const horario = (minutos: number) =>
            `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

          const titulo = `${encontro.data} · ${horario(encontro.inicioEmMinutos)}–${horario(encontro.fimEmMinutos)}`;

          return (
            <Button
              key={encontro.id}
              title={encontro.id === encontroId ? `Selecionado: ${titulo}` : titulo}
              onPress={() => {
                setEncontroId(encontro.id);
                setMensagemPresenca('');
              }}
            />
          );
        })}

        {mensagemPresenca ? (
          <Text accessibilityLiveRegion="polite" style={{ color: '#b91c1c' }}>
            {mensagemPresenca}
          </Text>
        ) : null}

        {/* CONTADOR */}
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          👥 Presentes: {presentes}
        </Text>

        {/* LISTA */}
        <FlatList
          data={alunosDaTurma}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const estaPresente = presentesNoEncontro.includes(item.id);

            return (
              <TouchableOpacity
                disabled={!encontroSelecionado || presencas === null || salvando}
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