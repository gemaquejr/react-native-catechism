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