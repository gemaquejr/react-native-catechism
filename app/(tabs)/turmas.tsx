import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';

type Turma = {
    id: string;
    nome: string;
};

export default function TurmasScreen() {
    const [turmas, setTurmas] = useState<Turma[] | null>(null);
    const [nome, setNome] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const gravando = useRef(false);

    useEffect(() => {
        let ativo = true;

        async function carregarTurmas() {
            try {
                const dados = await AsyncStorage.getItem('turmas');

                if (ativo) {
                    setTurmas(dados === null ? [] : JSON.parse(dados));
                }
            } catch {
                if (ativo) {
                    setErro('Não foi possível carregar as turmas. Reabra o app.');
                }
            }
        }

        void carregarTurmas();

        return () => {
            ativo = false;
        };
    }, []);

    async function criarTurma() {
        if (turmas === null || gravando.current) return;

        const nomeLimpo = nome.trim();

        if (!nomeLimpo) {
            setErro('Informe o nome da turma.');
            return;
        }

        gravando.current = true;
        setSalvando(true);
        setErro('');

        const atualizadas = [
            ...turmas,
            { id: Date.now().toString(), nome: nomeLimpo },
        ];

        try {
            await AsyncStorage.setItem('turmas', JSON.stringify(atualizadas));
            setTurmas(atualizadas);
            setNome('');
        } catch {
            setErro('Não foi possível salvar a turma. Tente novamente.');
        } finally {
            gravando.current = false;
            setSalvando(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' }}>
            <TextInput
                accessibilityLabel="Nome da turma"
                placeholder="Nome da turma"
                value={nome}
                onChangeText={setNome}
                editable={turmas !== null && !salvando}
                style={{ borderWidth: 1, borderColor: '#ddd', padding: 12 }}
            />
            {erro ? <Text style={{ color: '#b91c1c' }}>{erro}</Text> : null}
            <Button
                title={salvando ? 'Salvando…' : 'Criar turma'}
                disabled={turmas === null || salvando}
                onPress={criarTurma}
            />
            <FlatList
                data={turmas ?? []}
                keyExtractor={(turma) => turma.id}
                renderItem={({ item }) => (
                    <Text style={{ paddingVertical: 8 }}>{item.nome}</Text>
                )}
            />
        </View>
    );
}