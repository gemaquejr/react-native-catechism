import type { ArmazenamentoLocal } from '@/lib/armazenamentoLocal';

export type NovoEncontro = {
    turmaId: string;
    data: string;
    inicioEmMinutos: number;
    fimEmMinutos: number;
};

type Encontro = NovoEncontro & { id: string };

const CHAVE_ENCONTROS = 'encontros';

let filaDeGravacao: Promise<unknown> = Promise.resolve();

export async function listarEncontros(
    armazenamentoLocal: ArmazenamentoLocal,
): Promise<Encontro[]> {
    const dados = await armazenamentoLocal.getItem(CHAVE_ENCONTROS);
    return dados === null ? [] : JSON.parse(dados);
}

export async function criarEncontro(
    armazenamentoLocal: ArmazenamentoLocal,
    novo: NovoEncontro,
): Promise<Encontro> {
    const { turmaId, data, inicioEmMinutos, fimEmMinutos } = novo;
    const dia = new Date(`${data}T00:00:00.000Z`);

    if (
        !turmaId.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        Number.isNaN(dia.getTime()) ||
        dia.toISOString().slice(0, 10) !== data
    ) {
        throw new Error('Selecione uma turma e informe uma data válida.');
    }

    if (
        !Number.isInteger(inicioEmMinutos) ||
        !Number.isInteger(fimEmMinutos) ||
        inicioEmMinutos < 0 ||
        fimEmMinutos > 1440 ||
        inicioEmMinutos >= fimEmMinutos
    ) {
        throw new Error('Informe um horário de fim posterior ao início.');
    }

    const id = `${turmaId}:${data}:${inicioEmMinutos}:${fimEmMinutos}`;

    const operacao = filaDeGravacao.then(async () => {
        const encontros = await listarEncontros(armazenamentoLocal);
        const existente = encontros.find((encontro) => encontro.id === id);

        if (existente) return existente;

        const encontro = { ...novo, id };
        await armazenamentoLocal.setItem(
            CHAVE_ENCONTROS,
            JSON.stringify([...encontros, encontro]),
        );

        return encontro;
    });

    filaDeGravacao = operacao.catch(() => undefined);
    return operacao;
}