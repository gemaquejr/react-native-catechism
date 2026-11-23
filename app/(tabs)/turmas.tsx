import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';

import { matricularAluno } from '@/storage/matriculas';

type Turma = {
    id: string;
    nome: string;
};

type AlunoParaMatricula = {
    id: string;
    nome: string;
};

export default function TurmasScreen() {
    const [turmas, setTurmas] = useState<Turma[] | null>(null);
    const [nome, setNome] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const gravando = useRef(false);
    const [alunos, setAlunos] = useState<AlunoParaMatricula[] | null>(null);
    const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
    const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoParaMatricula | null>(null);
    const [matriculando, setMatriculando] = useState(false);
    const [mensagemMatricula, setMensagemMatricula] = useState('');
    const matriculaEmAndamento = useRef(false);

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

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarAlunos() {
                setAlunos(null);
                setAlunoSelecionado(null);

                try {
                    const dados = await AsyncStorage.getItem('alunos');
                    if (ativo) setAlunos(dados === null ? [] : JSON.parse(dados));
                } catch (error) {
                    console.error(error);
                    if (ativo) {
                        setMensagemMatricula('Não foi possível carregar os alunos.');
                    }
                }
            }

            void carregarAlunos();

            return () => {
                ativo = false;
            };
        }, []),
    );

    async function confirmarMatricula() {
        if (!turmaSelecionada || !alunoSelecionado || matriculaEmAndamento.current) {
            return;
        }

        matriculaEmAndamento.current = true;
        setMatriculando(true);
        setMensagemMatricula('');

        try {
            const resultado = await matricularAluno(alunoSelecionado.id, turmaSelecionada.id);

            setMensagemMatricula(
                resultado === 'ja-matriculado'
                    ? 'Este aluno já está matriculado nesta turma.'
                    : `${alunoSelecionado.nome} foi matriculado em ${turmaSelecionada.nome}.`,
            );
        } catch (error) {
            console.error(error);
            setMensagemMatricula('Não foi possível salvar a matrícula. Tente novamente.');
        } finally {
            matriculaEmAndamento.current = false;
            setMatriculando(false);
        }
    }

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
                    <Button
                        title={turmaSelecionada?.id === item.id ? `Selecionada: ${item.nome}` : item.nome}
                        disabled={matriculando}
                        onPress={() => {
                            setTurmaSelecionada(item);
                            setMensagemMatricula('');
                        }}
                    />
                )}
            />
            {turmaSelecionada ? (
                <>
                    <Text>Selecione um aluno para {turmaSelecionada.nome}</Text>
                    <FlatList
                        data={alunos ?? []}
                        keyExtractor={(aluno) => aluno.id}
                        ListEmptyComponent={
                            alunos?.length === 0 ? <Text>Cadastre um aluno primeiro.</Text> : null
                        }
                        renderItem={({ item }) => (
                            <Button
                                title={alunoSelecionado?.id === item.id ? `Selecionado: ${item.nome}` : item.nome}
                                disabled={matriculando}
                                onPress={() => {
                                    setAlunoSelecionado(item);
                                    setMensagemMatricula('');
                                }}
                            />
                        )}
                    />
                    <Button
                        title={matriculando ? 'Matriculando…' : 'Confirmar matrícula'}
                        disabled={alunos === null || !alunoSelecionado || matriculando}
                        onPress={confirmarMatricula}
                    />
                </>
            ) : null}
            {mensagemMatricula ? <Text accessibilityLiveRegion="polite">{mensagemMatricula}</Text> : null}
        </View>
    );
}