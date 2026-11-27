import type { ArmazenamentoLocal } from '@/lib/armazenamentoLocal';

type Matricula = {
    alunoId: string;
    turmaId: string;
};

const CHAVE_MATRICULAS = 'matriculas';

export async function listarMatriculas(armazenamentoLocal: ArmazenamentoLocal): Promise<Matricula[]> {
    const dados = await armazenamentoLocal.getItem(CHAVE_MATRICULAS);
    return dados === null ? [] : JSON.parse(dados);
}

let filaDeGravacao: Promise<unknown> = Promise.resolve();

export async function matricularAluno(
    armazenamentoLocal: ArmazenamentoLocal,
    alunoId: string,
    turmaId: string,
): Promise<'criada' | 'ja-matriculado'> {
    const operacao = filaDeGravacao.then(async () => {
        const matriculas = await listarMatriculas(armazenamentoLocal);

        const jaMatriculado = matriculas.some(
            (matricula) =>
                matricula.alunoId === alunoId && matricula.turmaId === turmaId,
        );

        if (jaMatriculado) return 'ja-matriculado' as const;

        await armazenamentoLocal.setItem(
            CHAVE_MATRICULAS,
            JSON.stringify([...matriculas, { alunoId, turmaId }]),
        );

        return 'criada' as const;
    });

    filaDeGravacao = operacao.catch(() => undefined);

    return operacao;
}