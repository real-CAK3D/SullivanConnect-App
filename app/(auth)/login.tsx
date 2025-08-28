
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '../../styles/commonStyles';
import Button from '../../components/Button';
import { useAppState } from '../../store/AppStateContext';

const roleOptions = [
  { label: 'Management', value: 'Management' as const },
  { label: 'Mechanic', value: 'Mechanic' as const },
  { label: 'General Service', value: 'General Service' as const },
  { label: 'Safty Personal', value: 'Safety Personal' as const },
  { label: 'Alignment Technician', value: 'Alignment Tech' as const },
];

type RoleOption = { label: string; value: typeof roleOptions[number]['value'] };

export default function Login() {
  const router = useRouter();
  const { role, accounts, deviceId, autoLoginForRole, loginOrCreateAccount } = useAppState();
  const [selectedRole, setSelectedRole] = useState<RoleOption['value'] | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      router.replace('/(app)/home');
    }
  }, [role, router]);

  const autoAcc = useMemo(() => {
    if (!selectedRole) return null;
    return accounts.find((a) => a.role === selectedRole && a.deviceId === deviceId) || null;
  }, [selectedRole, accounts, deviceId]);

  const handleAuto = async () => {
    if (!selectedRole) return;
    const ok = await autoLoginForRole(selectedRole);
    if (!ok) {
      setError('Auto-login failed. Please link or create an account.');
      console.log('Auto login failed');
      return;
    }
    router.replace('/(app)/home');
  };

  const handleLinkOrCreate = async () => {
    setError(null);
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }
    if (!name || !password) {
      setError('Enter name and password');
      return;
    }
    const ok = await loginOrCreateAccount({ role: selectedRole, name, password });
    if (!ok) {
      setError('Incorrect credentials');
      return;
    }
    router.replace('/(app)/home');
  };

  return (
    <KeyboardAvoidingView
      style={[commonStyles.container, { paddingHorizontal: 20 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ width: '100%', maxWidth: 520 }}>
        <Text style={[commonStyles.title, { marginBottom: 10 }]}>Welcome{'\n'}Please choose your Job Title.</Text>

        <View style={styles.roleRow}>
          {roleOptions.map((opt) => {
            const active = selectedRole === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSelectedRole(opt.value)}
                style={[styles.rolePill, { backgroundColor: active ? colors.primary : colors.card }]}
              >
                <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedRole ? (
          <View>
            {autoAcc ? (
              <View style={[commonStyles.card, { borderColor: colors.secondary }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>Auto login available</Text>
                <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Continue as {autoAcc.name} on this device.</Text>
                <Button text="Continue" onPress={handleAuto} style={{ width: 'auto' } as any} />
              </View>
            ) : null}

            <Text style={[commonStyles.label, { marginTop: 16 }]}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#9CA3AF" style={commonStyles.input} />

            <Text style={commonStyles.label}>Password</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="Set or enter password" placeholderTextColor="#9CA3AF" secureTextEntry style={commonStyles.input} />
            {error ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text> : null}
            <Button text="Continue" onPress={handleLinkOrCreate} />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10 as any,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
    marginBottom: 10,
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
});
