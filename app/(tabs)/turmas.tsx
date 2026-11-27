import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';

import { AcessoAdminContext } from '@/lib/acessoContext';
import { UsuarioLocalContext, useArmazenamentoLocal } from '@/lib/armazenamentoLocal';
import { criarEncontro } from '@/storage/encontros';
import { matricularAluno } from '@/storage/matriculas';

type Turma = {
    id: string;
    nome: string;
};

type TurmaCompartilhada = Turma & { dono_id: string | null };

type AlunoParaMatricula = {
    id: string;
    nome: string;
};

function horarioEmMinutos(valor: string): number | null {
    const horario = valor.trim();

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
        return null;
    }

    const [hora, minuto] = horario.split(':').map(Number);
    return hora * 60 + minuto;
}

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
    const [dataEncontro, setDataEncontro] = useState('');
    const [inicioEncontro, setInicioEncontro] = useState('');
    const [fimEncontro, setFimEncontro] = useState('');
    const [mensagemEncontro, setMensagemEncontro] = useState('');
    const [salvandoEncontro, setSalvandoEncontro] = useState(false);
    const encontroEmGravacao = useRef(false);
    const [turmasCompartilhadas, setTurmasCompartilhadas] =
        useState<TurmaCompartilhada[] | null>(null);
    const [erroTurmasCompartilhadas, setErroTurmasCompartilhadas] = useState('');
    const [turmaCompartilhadaId, setTurmaCompartilhadaId] = useState<string | null>(null);
    const [alunosCompartilhados, setAlunosCompartilhados] =
        useState<AlunoParaMatricula[] | null>(null);
    const [erroAlunosCompartilhados, setErroAlunosCompartilhados] = useState('');
    const [nomeTurmaCompartilhada, setNomeTurmaCompartilhada] = useState('');
    const [salvandoTurmaCompartilhada, setSalvandoTurmaCompartilhada] = useState(false);
    const [mensagemCriacaoTurma, setMensagemCriacaoTurma] = useState('');
    const criandoTurmaCompartilhada = useRef(false);
    const podeAdministrar = useContext(AcessoAdminContext);
    const usuarioId = useContext(UsuarioLocalContext);
    const [alunoParaTransferirId, setAlunoParaTransferirId] = useState<string | null>(null);
    const [mensagemMatriculaRemota, setMensagemMatriculaRemota] = useState('');
    const [matriculandoRemoto, setMatriculandoRemoto] = useState(false);
    const matriculaRemotaEmAndamento = useRef(false);

    const turmaOrigem = turmasCompartilhadas?.find(
        (turma) => turma.id === turmaCompartilhadaId,
    );

    const podeMatricularDaOrigem = Boolean(
        turmaOrigem && (podeAdministrar || (usuarioId && turmaOrigem.dono_id === usuarioId)),
    );

    const turmasDestino = (turmasCompartilhadas ?? []).filter(
        (turma) =>
            turma.id !== turmaCompartilhadaId &&
            (podeAdministrar || (usuarioId !== null && turma.dono_id === usuarioId)),
    );

    const armazenamentoLocal = useArmazenamentoLocal();

    useFocusEffect(
        useCallback(() => {
            if (turmaCompartilhadaId === null) return;

            const turmaId = turmaCompartilhadaId;
            let ativo = true;

            setAlunosCompartilhados(null);
            setErroAlunosCompartilhados('');

            async function carregarAlunosCompartilhados() {
                try {
                    const { data: matriculas, error: erroMatriculas } = await supabase
                        .from('matriculas')
                        .select('aluno_id')
                        .eq('turma_id', turmaId);

                    if (erroMatriculas) throw erroMatriculas;
                    if (!ativo) return;

                    const ids = (matriculas ?? []).map((matricula) => matricula.aluno_id);

                    if (ids.length === 0) {
                        setAlunosCompartilhados([]);
                        return;
                    }

                    const { data, error } = await supabase
                        .from('alunos')
                        .select('id, nome')
                        .in('id', ids)
                        .order('nome');

                    if (error) throw error;
                    if (ativo) setAlunosCompartilhados(data ?? []);
                } catch (error) {
                    console.error(error);
                    if (ativo) {
                        setErroAlunosCompartilhados('Não foi possível carregar os alunos da turma.');
                    }
                }
            }

            void carregarAlunosCompartilhados();

            return () => {
                ativo = false;
            };
        }, [turmaCompartilhadaId]),
    );

    useEffect(() => {
        let ativo = true;

        async function carregarTurmas() {
            try {
                const dados = await armazenamentoLocal.getItem('turmas');

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
    }, [armazenamentoLocal]);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarAlunos() {
                setAlunos(null);
                setAlunoSelecionado(null);

                try {
                    const dados = await armazenamentoLocal.getItem('alunos');
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
        }, [armazenamentoLocal]),
    );

    async function salvarEncontro() {
        if (!turmaSelecionada || encontroEmGravacao.current) return;

        const inicioEmMinutos = horarioEmMinutos(inicioEncontro);
        const fimEmMinutos = horarioEmMinutos(fimEncontro);

        if (inicioEmMinutos === null || fimEmMinutos === null) {
            setMensagemEncontro('Informe o início e o fim no formato HH:mm.');
            return;
        }

        encontroEmGravacao.current = true;
        setSalvandoEncontro(true);
        setMensagemEncontro('');

        try {
            await criarEncontro(armazenamentoLocal, {
                turmaId: turmaSelecionada.id,
                data: dataEncontro.trim(),
                inicioEmMinutos,
                fimEmMinutos,
            });

            setMensagemEncontro(`Encontro registrado em ${turmaSelecionada.nome}.`);
            setDataEncontro('');
            setInicioEncontro('');
            setFimEncontro('');
        } catch (error) {
            setMensagemEncontro(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar o encontro.',
            );
        } finally {
            encontroEmGravacao.current = false;
            setSalvandoEncontro(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            setTurmasCompartilhadas(null);
            setErroTurmasCompartilhadas('');

            async function carregarTurmasCompartilhadas() {
                try {
                    const { data, error } = await supabase
                        .from('turmas')
                        .select('id, nome, dono_id')
                        .order('nome');

                    if (error) throw error;
                    if (ativo) setTurmasCompartilhadas(data ?? []);
                } catch (error) {
                    console.error(error);
                    if (ativo) {
                        setErroTurmasCompartilhadas('Não foi possível carregar as turmas compartilhadas.');
                    }
                }
            }

            void carregarTurmasCompartilhadas();

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
            const resultado = await matricularAluno(armazenamentoLocal, alunoSelecionado.id, turmaSelecionada.id);

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
            await armazenamentoLocal.setItem('turmas', JSON.stringify(atualizadas));
            setTurmas(atualizadas);
            setNome('');
        } catch {
            setErro('Não foi possível salvar a turma. Tente novamente.');
        } finally {
            gravando.current = false;
            setSalvando(false);
        }
    }

    async function criarTurmaCompartilhada() {
        if (criandoTurmaCompartilhada.current) return;

        const nome = nomeTurmaCompartilhada.trim();

        if (!nome) {
            setMensagemCriacaoTurma('Informe o nome da turma.');
            return;
        }

        criandoTurmaCompartilhada.current = true;
        setSalvandoTurmaCompartilhada(true);
        setMensagemCriacaoTurma('');

        try {
            const { data, error } = await supabase
                .from('turmas')
                .insert({ nome })
                .select('id, nome, dono_id')
                .single();

            if (error) {
                setMensagemCriacaoTurma(
                    error.code === '42501'
                        ? 'Sua conta não tem permissão para criar turmas.'
                        : 'Não foi possível criar a turma. Tente novamente.',
                );
                return;
            }

            setTurmasCompartilhadas((atuais) =>
                [...(atuais ?? []).filter((turma) => turma.id !== data.id), data]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
            );
            setNomeTurmaCompartilhada('');
            setMensagemCriacaoTurma('Turma compartilhada criada.');
        } catch {
            setMensagemCriacaoTurma('Não foi possível criar a turma. Tente novamente.');
        } finally {
            criandoTurmaCompartilhada.current = false;
            setSalvandoTurmaCompartilhada(false);
        }
    }

    async function matricularEmOutraTurma(turmaDestinoId: string) {
        if (
            !podeMatricularDaOrigem ||
            !alunoParaTransferirId ||
            matriculaRemotaEmAndamento.current
        ) {
            return;
        }

        matriculaRemotaEmAndamento.current = true;
        setMensagemMatriculaRemota('Verificando matrícula…');
        setMensagemMatriculaRemota('');

        try {
            const { data, error } = await supabase.rpc('matricular_aluno_existente', {
                p_turma_id: turmaDestinoId,
                p_aluno_id: alunoParaTransferirId,
            });

            if (error) throw error;

            setMensagemMatriculaRemota(
                data === true ? 'Matrícula realizada.' : 'O aluno já está matriculado nesta turma.',
            );
        } catch {
            setMensagemMatriculaRemota('Não foi possível realizar a matrícula nesta turma.');
        } finally {
            matriculaRemotaEmAndamento.current = false;
            setMatriculandoRemoto(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: '#fff' }}>
            <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Turmas compartilhadas</Text>

                <TextInput
                    accessibilityLabel="Nome da turma compartilhada"
                    placeholder="Nome da turma compartilhada"
                    value={nomeTurmaCompartilhada}
                    onChangeText={setNomeTurmaCompartilhada}
                    editable={!salvandoTurmaCompartilhada}
                    style={{ borderWidth: 1, borderColor: '#ddd', padding: 12 }}
                />
                <Button
                    title={salvandoTurmaCompartilhada ? 'Salvando…' : 'Criar turma compartilhada'}
                    disabled={turmasCompartilhadas === null || salvandoTurmaCompartilhada}
                    onPress={criarTurmaCompartilhada}
                />
                {mensagemCriacaoTurma ? (
                    <Text accessibilityLiveRegion="polite">{mensagemCriacaoTurma}</Text>
                ) : null}

                {erroTurmasCompartilhadas ? (
                    <Text>{erroTurmasCompartilhadas}</Text>
                ) : turmasCompartilhadas === null ? (
                    <Text>Carregando turmas…</Text>
                ) : turmasCompartilhadas.length === 0 ? (
                    <Text>Sua conta ainda não está vinculada a nenhuma turma.</Text>
                ) : (
                    turmasCompartilhadas.map((turma) => (
                        <Button
                            key={turma.id}
                            title={turma.nome}
                            disabled={matriculandoRemoto}
                            onPress={() => {
                                setTurmaCompartilhadaId(turma.id);
                                setAlunoParaTransferirId(null);
                                setMensagemMatriculaRemota('');
                            }}
                        />
                    ))

                )}
                {turmaCompartilhadaId !== null ? (
                    <View style={{ gap: 4 }}>
                        <Text accessibilityLiveRegion="polite" style={{ minHeight: 22 }}>
                            {mensagemMatriculaRemota}
                        </Text>

                        {erroAlunosCompartilhados ? (
                            <Text>{erroAlunosCompartilhados}</Text>
                        ) : alunosCompartilhados === null ? (
                            <Text>Carregando alunos…</Text>
                        ) : alunosCompartilhados.length === 0 ? (
                            <Text>Nenhum aluno matriculado nesta turma.</Text>
                        ) : (
                            alunosCompartilhados.map((aluno) => (
                                podeMatricularDaOrigem ? (
                                    <Button
                                        key={aluno.id}
                                        title={alunoParaTransferirId === aluno.id ? `Selecionado: ${aluno.nome}` : aluno.nome}
                                        disabled={matriculandoRemoto}
                                        onPress={() => {
                                            setAlunoParaTransferirId(aluno.id);
                                            setMensagemMatriculaRemota('');
                                        }}
                                    />
                                ) : (
                                    <Text key={aluno.id}>{aluno.nome}</Text>
                                )
                            ))
                        )}

                        {podeMatricularDaOrigem && alunoParaTransferirId ? (
                            <View style={{ gap: 4 }}>
                                <Text>Matricular também em</Text>
                                {turmasDestino.length === 0 ? (
                                    <Text>Crie outra turma para matricular este aluno.</Text>
                                ) : (
                                    turmasDestino.map((turma) => (
                                        <Button
                                            key={turma.id}
                                            title={turma.nome}
                                            disabled={matriculandoRemoto}
                                            onPress={() => void matricularEmOutraTurma(turma.id)}
                                        />
                                    ))
                                )}
                            </View>
                        ) : null}

                        {mensagemMatriculaRemota ? (
                            <Text accessibilityLiveRegion="polite">{mensagemMatriculaRemota}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
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
                        disabled={matriculando || salvandoEncontro}
                        onPress={() => {
                            setTurmaSelecionada(item);
                            setMensagemMatricula('');
                            setMensagemEncontro('')
                        }}
                    />
                )}
            />

            {
                turmaSelecionada ? (
                    <View style={{ gap: 8 }}>
                        <Text>Novo encontro em {turmaSelecionada.nome}</Text>
                        <TextInput
                            accessibilityLabel="Data do encontro"
                            placeholder="Data (AAAA-MM-DD)"
                            value={dataEncontro}
                            onChangeText={setDataEncontro}
                            editable={!salvandoEncontro}
                        />
                        <TextInput
                            accessibilityLabel="Horário de início"
                            placeholder="Início (HH:mm)"
                            value={inicioEncontro}
                            onChangeText={setInicioEncontro}
                            editable={!salvandoEncontro}
                        />
                        <TextInput
                            accessibilityLabel="Horário de fim"
                            placeholder="Fim (HH:mm)"
                            value={fimEncontro}
                            onChangeText={setFimEncontro}
                            editable={!salvandoEncontro}
                        />
                        <Button
                            title={salvandoEncontro ? 'Salvando…' : 'Salvar encontro'}
                            disabled={salvandoEncontro}
                            onPress={salvarEncontro}
                        />
                        {mensagemEncontro ? (
                            <Text accessibilityLiveRegion="polite">{mensagemEncontro}</Text>
                        ) : null}
                    </View>
                ) : null
            }

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
                                disabled={matriculando || salvandoEncontro}
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