import { AcessoAdminContext } from '@/lib/acessoContext';
import { useArmazenamentoLocal } from '@/lib/armazenamentoLocal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

    const podeAdministrar = useContext(AcessoAdminContext);
    const [turmasCompartilhadas, setTurmasCompartilhadas] = useState<
        { id: string; nome: string }[] | null
    >(null);
    const [turmaCompartilhadaId, setTurmaCompartilhadaId] = useState<string | null>(null);
    const [erroTurmasCompartilhadas, setErroTurmasCompartilhadas] = useState('');
    const [mensagemCadastroCompartilhado, setMensagemCadastroCompartilhado] = useState('');

    const router = useRouter();
    const armazenamentoLocal = useArmazenamentoLocal();

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
            const dados = await armazenamentoLocal.getItem('alunos');
            const alunos: Aluno[] = dados === null ? [] : JSON.parse(dados);
            const novoAluno: Aluno = {
                id: Date.now().toString(),
                nome: nomeLimpo,
                pai,
                mae,
            };

            await armazenamentoLocal.setItem(
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

    useEffect(() => {
        let ativo = true;

        async function carregarTurmasCompartilhadas() {
            try {
                const { data: sessao, error: erroSessao } = await supabase.auth.getSession();
                if (erroSessao || !sessao.session) {
                    throw erroSessao ?? new Error('Sessão indisponível.');
                }

                const consulta = supabase.from('turmas').select('id, nome').order('nome');

                if (!podeAdministrar) {
                    consulta.eq('dono_id', sessao.session.user.id);
                }

                const { data, error } = await consulta;
                if (error) throw error;

                if (ativo) setTurmasCompartilhadas(data ?? []);
            } catch {
                if (ativo) setErroTurmasCompartilhadas('Não foi possível carregar as turmas.');
            }
        }

        void carregarTurmasCompartilhadas();

        return () => {
            ativo = false;
        };
    }, [podeAdministrar]);

    async function cadastrarNaTurmaCompartilhada() {
        if (!turmaCompartilhadaId || gravacaoEmAndamento.current) return;

        const nomeLimpo = nome.trim();
        setMensagemCadastroCompartilhado('');

        if (!nomeLimpo) {
            setMensagemCadastroCompartilhado('Informe o nome do aluno.');
            return;
        }

        gravacaoEmAndamento.current = true;
        setSalvando(true);

        try {
            const { error } = await supabase.rpc('cadastrar_aluno_na_turma', {
                p_turma_id: turmaCompartilhadaId,
                p_nome: nomeLimpo,
                p_pai: pai,
                p_mae: mae,
            });

            if (error) {
                setMensagemCadastroCompartilhado(
                    error.code === '42501'
                        ? 'Sua conta não pode cadastrar alunos nesta turma.'
                        : 'Não foi possível salvar o cadastro. Tente novamente.',
                );
                return;
            }

            setNome('');
            setPai('');
            setMae('');
            setMensagemCadastroCompartilhado('Aluno cadastrado e matriculado.');
        } catch {
            setMensagemCadastroCompartilhado('Não foi possível salvar o cadastro. Tente novamente.');
        } finally {
            gravacaoEmAndamento.current = false;
            setSalvando(false);
        }
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

                <Text style={{ fontWeight: 'bold', marginVertical: 8 }}>
                    Turma compartilhada
                </Text>

                {erroTurmasCompartilhadas ? (
                    <Text>{erroTurmasCompartilhadas}</Text>
                ) : turmasCompartilhadas === null ? (
                    <Text>Carregando turmas…</Text>
                ) : turmasCompartilhadas.length === 0 ? (
                    <Text>Você ainda não tem turmas disponíveis para cadastro.</Text>
                ) : (
                    turmasCompartilhadas.map((turma) => (
                        <Button
                            key={turma.id}
                            title={turma.id === turmaCompartilhadaId ? `Selecionada: ${turma.nome}` : turma.nome}
                            disabled={salvando}
                            onPress={() => {
                                setTurmaCompartilhadaId(turma.id);
                                setMensagemCadastroCompartilhado('');
                            }}
                        />
                    ))
                )}

                <Button
                    title="Cadastrar na turma selecionada"
                    disabled={turmaCompartilhadaId === null || salvando}
                    onPress={cadastrarNaTurmaCompartilhada}
                />

                {mensagemCadastroCompartilhado ? (
                    <Text accessibilityLiveRegion="polite">{mensagemCadastroCompartilhado}</Text>
                ) : null}

                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    Cadastrar localmente
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