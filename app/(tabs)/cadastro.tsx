import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type Aluno = {
    id: string;
    nome: string;
    pai: string;
    mae: string;
};

export default function CadastroScreen() {
    const [nome, setNome] = useState('');
    const [pai, setPai] = useState('');
    const [mae, setMae] = useState('');

    async function adicionarAluno() {
        if (!nome) return;

        const novoAluno: Aluno = {
            id: Date.now().toString(),
            nome,
            pai,
            mae
        };

        const dados = await AsyncStorage.getItem('alunos');
        const alunos: Aluno[] = dados ? JSON.parse(dados) : [];

        const atualizados = [...alunos, novoAluno];

        await AsyncStorage.setItem('alunos', JSON.stringify(atualizados));

        setNome('');
        setPai('');
        setMae('');
    }

    return (
        <View style={{ flex: 1, padding: 20, marginTop: 50, backgroundColor: '#fff' }}>

            <Text style={{ fontSize: 20, marginBottom: 10 }}>
                Cadastro de Aluno
            </Text>

            <TextInput placeholder="Nome do aluno" value={nome} onChangeText={setNome} style={input} />
            <TextInput placeholder="Nome do pai" value={pai} onChangeText={setPai} style={input} />
            <TextInput placeholder="Nome da mãe" value={mae} onChangeText={setMae} style={input} />

            <TouchableOpacity
                onPress={adicionarAluno}
                style={{
                    backgroundColor: '#007bff',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    Cadastrar
                </Text>
            </TouchableOpacity>

        </View>
    );
}

const input = {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
};