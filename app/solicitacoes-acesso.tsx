import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

type Solicitacao = {
    usuario_id: string;
    email: string;
};

export default function SolicitacoesAcessoScreen() {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[] | null>(null);
    const [erroLista, setErroLista] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [aprovandoId, setAprovandoId] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            try {
                const { data, error } = await supabase.rpc('listar_solicitacoes_pendentes');

                if (error) throw error;
                if (ativo) setSolicitacoes(data ?? []);
            } catch {
                if (ativo) setErroLista('Não foi possível carregar as solicitações.');
            }
        }

        void carregar();

        return () => {
            ativo = false;
        };
    }, []);

    async function aprovar(solicitacao: Solicitacao) {
        if (aprovandoId !== null) return;

        setAprovandoId(solicitacao.usuario_id);
        setMensagem('');

        try {
            const { data, error } = await supabase.rpc('aprovar_catequista', {
                p_usuario_id: solicitacao.usuario_id,
            });

            if (error) throw error;

            setSolicitacoes((atuais) =>
                atuais?.filter((item) => item.usuario_id !== solicitacao.usuario_id) ?? [],
            );
            setMensagem(data === true ? 'Acesso aprovado.' : 'A solicitação já foi atualizada.');
        } catch {
            setMensagem('Não foi possível aprovar. Tente novamente.');
        } finally {
            setAprovandoId(null);
        }
    }

    return (
        <View style={{ flex: 1, padding: 24, gap: 12 }}>
            <Link href="/">Voltar à chamada</Link>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Solicitações de acesso</Text>
            {mensagem ? <Text accessibilityLiveRegion="polite">{mensagem}</Text> : null}

            {erroLista ? (
                <Text>{erroLista}</Text>
            ) : solicitacoes === null ? (
                <Text>Carregando solicitações…</Text>
            ) : (
                <FlatList
                    data={solicitacoes}
                    keyExtractor={(item) => item.usuario_id}
                    ListEmptyComponent={<Text>Nenhuma solicitação pendente.</Text>}
                    renderItem={({ item }) => (
                        <View style={{ gap: 6, marginBottom: 16 }}>
                            <Text>{item.email}</Text>
                            <Button
                                title={aprovandoId === item.usuario_id ? 'Aprovando…' : 'Aprovar'}
                                accessibilityLabel={`Aprovar acesso de ${item.email}`}
                                disabled={aprovandoId !== null}
                                onPress={() => void aprovar(item)}
                            />
                        </View>
                    )}
                />
            )}
        </View>
    );
}