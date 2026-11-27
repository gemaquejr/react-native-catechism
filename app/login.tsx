import { supabase } from '@/lib/supabase';
import { useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [processando, setProcessando] = useState(false);
    const operacaoEmAndamento = useRef(false);

    async function entrar() {
        if (operacaoEmAndamento.current) return;

        if (!email.trim() || !senha.trim()) {
            setMensagem('Preencha o e-mail e a senha.');
            return;
        }

        operacaoEmAndamento.current = true;
        setProcessando(true);
        setMensagem('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: senha,
            });

            if (error) {
                setMensagem(
                    error.code === 'invalid_credentials'
                        ? 'E-mail ou senha incorretos.'
                        : 'Não foi possível entrar. Tente novamente.',
                );
            }
        } catch {
            setMensagem('Não foi possível entrar. Verifique a conexão e tente novamente.');
        } finally {
            operacaoEmAndamento.current = false;
            setProcessando(false);
        }
    }

    async function solicitarAcesso() {
        if (operacaoEmAndamento.current) return;

        const emailLimpo = email.trim();

        if (!emailLimpo || !senha.trim()) {
            setMensagem('Preencha o e-mail e a senha.');
            return;
        }

        operacaoEmAndamento.current = true;
        setProcessando(true);
        setMensagem('');

        try {
            const { data, error } = await supabase.auth.signUp({
                email: emailLimpo,
                password: senha,
            });

            if (error) {
                setMensagem(
                    error.code === 'signup_disabled'
                        ? 'As solicitações de acesso ainda não estão abertas.'
                        : 'Não foi possível solicitar acesso. Confira os dados e tente novamente.',
                );
                return;
            }

            setSenha('');

            if (!data.session) {
                setMensagem(
                    'Confira seu e-mail para confirmar a conta. Depois, entre para acompanhar a aprovação.',
                );
            }
        } catch {
            setMensagem('Não foi possível solicitar acesso. Verifique sua conexão.');
        } finally {
            operacaoEmAndamento.current = false;
            setProcessando(false);
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 24, marginBottom: 20, fontWeight: 'bold' }}>
                Acesso
            </Text>

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={input}
            />

            <TextInput
                placeholder="Senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                style={input}
            />

            {mensagem ? (
                <Text accessibilityLiveRegion="polite" style={{ marginBottom: 12 }}>
                    {mensagem}
                </Text>
            ) : null}

            <TouchableOpacity
                disabled={processando}
                onPress={() => { entrar() }}
                style={botao}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                disabled={processando}
                onPress={solicitarAcesso}
                style={[botao, { marginTop: 8 }]}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    Solicitar acesso
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const input = {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
};

const botao: ViewStyle = {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
};