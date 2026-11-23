import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const gravacaoEmAndamento = useRef(false);

    const router = useRouter();

    async function adicionarAluno() {
        if (gravacaoEmAndamento.current) return;

        const nomeLimpo = nome.trim();

        if (!nomeLimpo) {
            setErro('Informe o nome do aluno.');
            return;
        }

        gravacaoEmAndamento.current = true;
        setSalvando(true);
        setErro('');

        try {
            const dados = await AsyncStorage.getItem('alunos');
            const alunos: Aluno[] = dados === null ? [] : JSON.parse(dados);
            const novoAluno: Aluno = {
                id: Date.now().toString(),
                nome: nomeLimpo,
                pai,
                mae,
            };

            await AsyncStorage.setItem(
                'alunos',
                JSON.stringify([...alunos, novoAluno]),
            );
        } catch (error) {
            console.error(error);
            setErro('Não foi possível salvar o cadastro. Tente novamente.');
            return;
        } finally {
            gravacaoEmAndamento.current = false;
            setSalvando(false);
        }

        setNome('');
        setPai('');
        setMae('');
        Alert.alert('Sucesso', 'Aluno cadastrado ✅');
        router.back();
    }

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>

            <Text style={{ fontSize: 20, marginBottom: 10 }}>
                Cadastro de Aluno
            </Text>

            <TextInput placeholder="Nome do aluno" value={nome} onChangeText={setNome} style={input} />
            <TextInput placeholder="Nome do pai" value={pai} onChangeText={setPai} style={input} />
            <TextInput placeholder="Nome da mãe" value={mae} onChangeText={setMae} style={input} />

            {erro ? <Text style={{ color: '#b91c1c', marginBottom: 10 }}>{erro}</Text> : null}

            <TouchableOpacity
                disabled={salvando}
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