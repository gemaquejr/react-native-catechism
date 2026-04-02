import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
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
  const [nome, setNome] = useState('');
  const [pai, setPai] = useState('');
  const [mae, setMae] = useState('');

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<{ [data: string]: string[] }>({});

  const dataHoje = getDataHoje();
  const presentesHoje = presencas[dataHoje] || [];

  // 🔽 carregar dados ao abrir
  useEffect(() => {
    carregarDados();
  }, []);

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

  function adicionarAluno() {
    if (!nome) return;

    const novoAluno: Aluno = {
      id: Date.now().toString(),
      nome,
      pai,
      mae
    };

    setAlunos([...alunos, novoAluno]);

    setNome('');
    setPai('');
    setMae('');
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
      <View style={{ flex: 1, padding: 20, marginTop: 50, backgroundColor: '#fff' }}>

        {/* INPUTS */}
        <TextInput
          placeholder="Nome do aluno"
          value={nome}
          onChangeText={setNome}
          style={input}
        />

        <TextInput
          placeholder="Nome do pai"
          value={pai}
          onChangeText={setPai}
          style={input}
        />

        <TextInput
          placeholder="Nome da mãe"
          value={mae}
          onChangeText={setMae}
          style={input}
        />

        {/* BOTÃO */}
        <TouchableOpacity
          onPress={adicionarAluno}
          disabled={!nome}
          style={{
            backgroundColor: nome ? '#007bff' : '#999',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            Cadastrar aluno
          </Text>
        </TouchableOpacity>

        {/* CONTADOR */}
        <Text style={{ marginTop: 20, fontSize: 16 }}>
          Presentes hoje: {presentes}
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
                  <Text style={{ fontSize: 12, color: '#555' }}>
                    Pai: {item.pai} | Mãe: {item.mae}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

      </View>
    </KeyboardAvoidingView>
  );
}

// 🎨 estilo reaproveitável
const input = {
  borderWidth: 1,
  borderColor: '#ddd',
  marginBottom: 10,
  padding: 12,
  borderRadius: 8,
  backgroundColor: '#f9f9f9'
};