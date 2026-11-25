import { useAtualizarSessao } from '@/contexts/SessaoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const atualizarSessao = useAtualizarSessao();
    const [mensagem, setMensagem] = useState('');
    const [processando, setProcessando] = useState(false);
    const operacaoEmAndamento = useRef(false);

    async function enviarFormulario(acao: 'entrar' | 'criar-conta') {
        if (operacaoEmAndamento.current) return;

        const nome = usuario.trim();

        if (!nome || !senha.trim()) {
            setMensagem('Preencha o usuário e a senha.');
            return;
        }

        operacaoEmAndamento.current = true;
        setProcessando(true);
        setMensagem('');

        try {
            const [[, usuarioSalvo], [, senhaSalva]] = await AsyncStorage.multiGet([
                'usuario',
                'senha',
            ]);

            if (acao === 'criar-conta') {
                if (usuarioSalvo || senhaSalva) {
                    setMensagem('Já existe uma conta neste dispositivo. Use Entrar.');
                    return;
                }

                await AsyncStorage.multiSet([
                    ['usuario', nome],
                    ['senha', senha],
                ]);

                setSenha('');
                setMensagem('Conta criada. Digite sua senha e toque em Entrar.');
                return;
            }

            if (!usuarioSalvo || !senhaSalva) {
                setMensagem('Nenhuma conta válida encontrada. Use Criar conta no primeiro acesso.');
                return;
            }

            if (nome !== usuarioSalvo || senha !== senhaSalva) {
                setMensagem('Usuário ou senha incorretos.');
                return;
            }

            await AsyncStorage.setItem('logado', 'true');
            atualizarSessao(true);
        } catch (error) {
            console.error(error);
            setMensagem('Não foi possível concluir a operação. Tente novamente.');
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
                placeholder="Usuário"
                value={usuario}
                onChangeText={setUsuario}
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
                onPress={() => enviarFormulario('entrar')}
                style={botao}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                disabled={processando}
                onPress={() => enviarFormulario('criar-conta')}
                style={[botao, { marginTop: 8 }]}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Criar conta</Text>
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