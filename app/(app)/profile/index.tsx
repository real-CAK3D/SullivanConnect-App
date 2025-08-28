
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Image, TouchableOpacity, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';
import SettingsSheet from '../../../components/SettingsSheet';

export default function ProfileScreen() {
  const { role, accounts, currentAccount, updateAccount, setSchedule } = useAppState();
  const isManagement = role === 'Management';
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(currentAccount?.id || null);

  const acc = useMemo(() => {
    if (isManagement) {
      return accounts.find((a) => a.id === selectedAccountId) || null;
    }
    return currentAccount;
  }, [isManagement, selectedAccountId, accounts, currentAccount]);

  const [form, setForm] = useState({
    name: acc?.name || '',
    password: acc?.password || '',
    email: acc?.email || '',
    phone: acc?.phone || '',
    avatarUri: acc?.avatarUri || '',
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState(acc?.schedule || null);

  // keep form in sync when switching account
  if (acc && scheduleDraft && acc.id !== (selectedAccountId || acc.id)) {
    // no-op
  }

  const accountOptions = useMemo(() => {
    if (!isManagement) return [];
    return accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.role})` }));
  }, [isManagement, accounts]);

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (res.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access to set a profile image.');
        return;
      }
      const img = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!img.canceled && img.assets && img.assets[0]?.uri) {
        const uri = img.assets[0].uri;
        setForm((p) => ({ ...p, avatarUri: uri }));
      }
    } catch (e) {
      console.log('Image pick failed', e);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const saveProfile = () => {
    if (!acc) return;
    if (!form.name || !form.password) {
      Alert.alert('Missing fields', 'Name and password are required.');
      return;
    }
    updateAccount(acc.id, {
      name: form.name,
      password: form.password,
      email: form.email || undefined,
      phone: form.phone || undefined,
      avatarUri: form.avatarUri || undefined,
    });
    Alert.alert('Saved', 'Profile updated.');
  };

  const saveSchedule = () => {
    if (!acc || !scheduleDraft) return;
    setSchedule(acc.id, scheduleDraft);
    Alert.alert('Saved', 'Schedule updated.');
  };

  const updateDay = (dayKey: string, patch: Partial<{ start: string; end: string; off: boolean }>) => {
    if (!scheduleDraft) return;
    const newDay = { ...scheduleDraft[dayKey as keyof typeof scheduleDraft], ...patch };
    const next = { ...scheduleDraft, [dayKey]: newDay };
    setScheduleDraft(next);
  };

  return (
    <KeyboardAvoidingView style={[commonStyles.container, { alignItems: 'stretch' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[commonStyles.title, { textAlign: 'left' }]}>Profile</Text>

        {isManagement ? (
          <View style={[commonStyles.card]}>
            <Text style={[commonStyles.label]}>Manage employee</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
              {accountOptions.map((opt) => {
                const active = selectedAccountId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                    onPress={() => {
                      setSelectedAccountId(opt.id);
                      const a = accounts.find((x) => x.id === opt.id);
                      if (a) {
                        setForm({
                          name: a.name,
                          password: a.password,
                          email: a.email || '',
                          phone: a.phone || '',
                          avatarUri: a.avatarUri || '',
                        });
                        setScheduleDraft(a.schedule);
                      }
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {!acc ? (
          <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No account selected.</Text>
        ) : (
          <>
            <View style={[commonStyles.card, { alignItems: 'center' }]}>
              <TouchableOpacity onPress={handlePickImage} style={{ alignItems: 'center' }}>
                {form.avatarUri ? (
                  <Image source={{ uri: form.avatarUri }} style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 10 }} />
                ) : (
                  <View style={[styles.avatarPlaceholder]}>
                    <Text style={{ color: colors.text, fontWeight: '800' }}>{(form.name || 'A').slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Set Profile Image</Text>
              </TouchableOpacity>
              <View style={{ height: 10 }} />
              <Text style={[commonStyles.label]}>Name</Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
                placeholder="Full name"
                placeholderTextColor="#9CA3AF"
                style={commonStyles.input}
              />
              <Text style={[commonStyles.label]}>Password</Text>
              <TextInput
                value={form.password}
                onChangeText={(t) => setForm((p) => ({ ...p, password: t }))}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                style={commonStyles.input}
              />
              <Text style={[commonStyles.label]}>Email (optional)</Text>
              <TextInput
                value={form.email}
                onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                style={commonStyles.input}
              />
              <Text style={[commonStyles.label]}>Phone (optional)</Text>
              <TextInput
                value={form.phone}
                onChangeText={(t) => setForm((p) => ({ ...p, phone: t }))}
                placeholder="(555) 555-5555"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={commonStyles.input}
              />
              <Button text="Save Profile" onPress={saveProfile} />
              <View style={{ height: 8 }} />
              <Button text="Open Settings" onPress={() => setSettingsOpen(true)} style={{ backgroundColor: colors.card }} textStyle={{ color: colors.text }} />
            </View>

            <View style={[commonStyles.card]}>
              <Text style={[commonStyles.label, { marginBottom: 10 }]}>Work Hours & Days Off</Text>
              {!scheduleDraft ? (
                <Text style={commonStyles.smallText}>No schedule.</Text>
              ) : (
                Object.keys(scheduleDraft).map((k) => {
                  const day = scheduleDraft[k as keyof typeof scheduleDraft];
                  return (
                    <View key={k} style={[styles.dayRow]}>
                      <Text style={{ width: 44, color: colors.text, fontWeight: '800' }}>{day.day}</Text>
                      <TouchableOpacity
                        onPress={() => updateDay(k, { off: !day.off })}
                        style={[styles.offToggle, { backgroundColor: day.off ? colors.danger : colors.card }]}
                      >
                        <Text style={{ color: day.off ? '#fff' : colors.text, fontWeight: '700' }}>{day.off ? 'Off' : 'Working'}</Text>
                      </TouchableOpacity>
                      <TextInput
                        value={day.start}
                        onChangeText={(t) => updateDay(k, { start: t })}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                        style={[commonStyles.input, styles.timeInput, { opacity: day.off ? 0.5 : 1 }]}
                        editable={!day.off}
                      />
                      <Text style={{ marginHorizontal: 6, color: colors.text }}>-</Text>
                      <TextInput
                        value={day.end}
                        onChangeText={(t) => updateDay(k, { end: t })}
                        placeholder="17:00"
                        placeholderTextColor="#9CA3AF"
                        style={[commonStyles.input, styles.timeInput, { opacity: day.off ? 0.5 : 1 }]}
                        editable={!day.off}
                      />
                    </View>
                  );
                })
              )}
              <Button text="Save Schedule" onPress={saveSchedule} />
            </View>
          </>
        )}
      </ScrollView>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginVertical: 6,
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    boxShadow: '0px 8px 14px rgba(0,0,0,0.06)',
  } as any,
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.06)',
  } as any,
  timeInput: {
    width: 90,
    marginBottom: 0,
  },
});
