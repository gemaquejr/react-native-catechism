import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useMemo } from 'react';

export const UsuarioLocalContext = createContext<string | null>(null);

function criarArmazenamentoLocal(usuarioId: string) {
    const prefixo = `catechism:${usuarioId}:`;

    return {
        getItem: (chave: string) => AsyncStorage.getItem(`${prefixo}${chave}`),
        setItem: (chave: string, valor: string) =>
            AsyncStorage.setItem(`${prefixo}${chave}`, valor),
    };
}

export type ArmazenamentoLocal = ReturnType<typeof criarArmazenamentoLocal>;

export function useArmazenamentoLocal(): ArmazenamentoLocal {
    const usuarioId = useContext(UsuarioLocalContext);

    return useMemo(() => {
        if (!usuarioId) {
            throw new Error('O armazenamento local exige uma conta autenticada.');
        }

        return criarArmazenamentoLocal(usuarioId);
    }, [usuarioId]);
}