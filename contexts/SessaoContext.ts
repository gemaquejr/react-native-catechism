import { createContext, useContext } from 'react';

export const SessaoContext = createContext<((logado: boolean) => void) | null>(
    null,
);

export function useAtualizarSessao() {
    const atualizarSessao = useContext(SessaoContext);

    if (!atualizarSessao) {
        throw new Error('SessaoContext indisponível.');
    }

    return atualizarSessao;
}