import { UsuarioLocalContext } from '@/lib/armazenamentoLocal';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

type Acesso = {
  usuarioId: string;
  status: 'pendente' | 'aprovado' | 'revogado' | 'sem-perfil' | 'erro';
};

export default function RootLayout() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [erroSaida, setErroSaida] = useState('');

  const usuarioId = sessao?.user.id;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuarioId) return;

    const id = usuarioId;
    let ativo = true;

    async function consultarAcesso() {
      try {
        const { data, error } = await supabase
          .from('perfis_acesso')
          .select('status')
          .eq('usuario_id', id)
          .maybeSingle();

        if (error) throw error;
        if (!ativo) return;

        const status = data?.status;

        setAcesso({
          usuarioId: id,
          status:
            status === 'pendente' || status === 'aprovado' || status === 'revogado'
              ? status
              : 'sem-perfil',
        });
      } catch {
        if (ativo) setAcesso({ usuarioId: id, status: 'erro' });
      }
    }

    void consultarAcesso();

    return () => {
      ativo = false;
    };
  }, [usuarioId, tentativa]);

  if (sessao === undefined) return null;

  const logado = sessao !== null;

  if (logado) {
    if (!acesso || acesso.usuarioId !== usuarioId) {
      return <Text style={{ padding: 24 }}>Verificando acesso…</Text>;
    }

    if (acesso.status !== 'aprovado') {
      const mensagens = {
        pendente: 'Aguardando aprovação do administrador.',
        revogado: 'Seu acesso foi revogado.',
        'sem-perfil': 'Seu perfil de acesso ainda não foi configurado.',
        erro: 'Não foi possível verificar seu acesso.',
      };

      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text accessibilityLiveRegion="polite">{mensagens[acesso.status]}</Text>
          <Button
            title="Verificar novamente"
            onPress={() => {
              setAcesso(null);
              setTentativa((atual) => atual + 1);
            }}
          />
          <Button
            title="Sair"
            onPress={async () => {
              setErroSaida('');

              try {
                const { error } = await supabase.auth.signOut({ scope: 'local' });
                if (error) throw error;
                setAcesso(null);
              } catch {
                setErroSaida('Não foi possível sair. Tente novamente.');
              }
            }}
          />
          {erroSaida ? <Text accessibilityLiveRegion="polite">{erroSaida}</Text> : null}
        </View>
      );
    }
  }

  if (logado === null) return null;

  return (
    <>
      <UsuarioLocalContext.Provider key={usuarioId ?? 'visitante'} value={usuarioId ?? null}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!logado}>
            <Stack.Screen name="login" />
          </Stack.Protected>

          <Stack.Protected guard={logado}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" />
          </Stack.Protected>
        </Stack>
      </UsuarioLocalContext.Provider>
      <StatusBar style="auto" />
    </>
  );
}