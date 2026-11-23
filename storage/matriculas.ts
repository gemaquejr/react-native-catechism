import AsyncStorage from '@react-native-async-storage/async-storage';

type Matricula = {
    alunoId: string;
    turmaId: string;
};

const CHAVE_MATRICULAS = 'matriculas';

let filaDeGravacao: Promise<unknown> = Promise.resolve();

export async function matricularAluno(
    alunoId: string,
    turmaId: string,
): Promise<'criada' | 'ja-matriculado'> {
    const operacao = filaDeGravacao.then(async () => {
        const dados = await AsyncStorage.getItem(CHAVE_MATRICULAS);
        const matriculas: Matricula[] = dados === null ? [] : JSON.parse(dados);

        const jaMatriculado = matriculas.some(
            (matricula) =>
                matricula.alunoId === alunoId && matricula.turmaId === turmaId,
        );

        if (jaMatriculado) return 'ja-matriculado' as const;

        await AsyncStorage.setItem(
            CHAVE_MATRICULAS,
            JSON.stringify([...matriculas, { alunoId, turmaId }]),
        );

        return 'criada' as const;
    });

    filaDeGravacao = operacao.catch(() => undefined);

    return operacao;
}