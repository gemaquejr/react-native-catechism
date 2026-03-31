import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Aluno = {
  id: string;
  nome: string;
  presente: boolean;
};

export default function HomeScreen() {
  const [nome, setNome] = useState('');
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
    salvarAlunos();
  }, [alunos]);

  async function carregarAlunos() {
    try {
      const dados = await AsyncStorage.getItem('alunos');
      if (dados !== null) {
        setAlunos(JSON.parse(dados));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function salvarAlunos() {
    try {
      await AsyncStorage.setItem('alunos', JSON.stringify(alunos));
    } catch (error) {
      console.log(error);
    }
  }

  function adicionarAluno() {
    if (!nome) return;

    const novoAluno: Aluno = {
      id: Date.now().toString(),
      nome,
      presente: false
    };

    setAlunos([...alunos, novoAluno]);
    setNome('');
  }

  function marcarPresenca(id: string) {
    const atualizados = alunos.map(aluno =>
      aluno.id === id
        ? { ...aluno, presente: !aluno.presente }
        : aluno
    );

    setAlunos(atualizados);
  }

  const presentes = alunos.filter(a => a.presente).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, padding: 20, marginTop: 50, backgroundColor: '#fff' }}>

        <TextInput
          placeholder="Nome do aluno"
          placeholderTextColor="#999"
          value={nome}
          onChangeText={(text) => setNome(text)}
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            marginBottom: 10,
            padding: 12,
            borderRadius: 8,
            backgroundColor: '#f9f9f9'
          }}
        />

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
            Adicionar
          </Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 20 }}>
          Presentes: {presentes}
        </Text>

        <FlatList
          data={alunos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => marcarPresenca(item.id)}>
              <View style={{
                padding: 12,
                backgroundColor: item.presente ? '#d4edda' : '#f1f1f1',
                marginTop: 8,
                borderRadius: 8
              }}>
                <Text style={{ fontSize: 16 }}>
                  {item.nome}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

      </View>
    </KeyboardAvoidingView>
  );
}