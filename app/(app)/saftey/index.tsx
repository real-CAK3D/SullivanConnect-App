
import { useMemo, useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';
import type { Role } from '../../../store/types';

const targetRoles: Role[] = ['General Service', 'Mechanic', 'Management', 'Alignment Tech', 'Safety Personal'];

export default function SafetyScreen() {
  const { accounts, currentAccount, safetyRequirements, createSafetyRequirement, verifySafety, setSafetyRequirementActive } = useAppState();
  const role = currentAccount?.role || null;
  const isSafety = role === 'Safety Personal';

  // Create requirement (Safety only)
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [targetRole, setTargetRole] = useState<Role>('Mechanic');
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setTargetRole('Mechanic');
    setActive(true);
  };

  const handleCreate = () => {
    createSafetyRequirement({
      title: title.trim(),
      description: desc.trim() || undefined,
      targetRole,
      active,
    } as any);
    resetForm();
  };

  // For verification (Safety only)
  const [verifyForAccountId, setVerifyForAccountId] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState('');
  const candidates = useMemo(() => accounts.filter((a) => a.role === targetRole || a.role !== 'Safety Personal'), [accounts, targetRole]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Safety</Text>

      {isSafety ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.label}>Create requirement</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
            style={commonStyles.input}
          />
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Description (optional)"
            placeholderTextColor="#9CA3AF"
            style={[commonStyles.input, { height: 90, textAlignVertical: 'top' }]}
            multiline
          />
          <Text style={commonStyles.label}>Target role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            {targetRoles.map((r) => {
              const activeR = targetRole === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setTargetRole(r)}
                  style={[styles.pill, { backgroundColor: activeR ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: activeR ? '#fff' : colors.text, fontWeight: '700' }}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={commonStyles.label}>Active?</Text>
          <View style={{ flexDirection: 'row', gap: 8 as any }}>
            {[
              { label: 'Active', value: true },
              { label: 'Inactive', value: false },
            ].map((opt) => {
              const activeSel = active === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => setActive(opt.value)}
                  style={[styles.pill, { backgroundColor: activeSel ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: activeSel ? '#fff' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 8 }} />
          <Button text="Create" onPress={handleCreate} style={{ width: 'auto', paddingHorizontal: 16 } as any} />
        </View>
      ) : null}

      {/* List & verify */}
      {safetyRequirements.length === 0 ? (
        <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No requirements yet.</Text>
      ) : null}
      {safetyRequirements
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((r) => {
          const verCount = r.verifications?.length || 0;
          return (
            <View key={r.id} style={commonStyles.card}>
              <View style={commonStyles.rowBetween}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{r.title}</Text>
                <Text style={commonStyles.tag}>{r.active ? 'ACTIVE' : 'INACTIVE'}</Text>
              </View>
              {r.description ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{r.description}</Text> : null}
              <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Target: {r.targetRole}</Text>
              <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Verifications: {verCount}</Text>
              {isSafety ? (
                <>
                  <View style={{ height: 8 }} />
                  <View style={commonStyles.rowBetween}>
                    <Button
                      text={r.active ? 'Set Inactive' : 'Set Active'}
                      onPress={() => setSafetyRequirementActive(r.id, !r.active)}
                      style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
                      textStyle={{ color: colors.text }}
                    />
                  </View>
                  <View style={{ height: 8 }} />
                  <Text style={commonStyles.label}>Verify for employee</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
                    {accounts
                      .filter((a) => a.role === r.targetRole || r.targetRole === 'Management' || r.targetRole === a.role)
                      .map((a) => {
                        const activeSel = verifyForAccountId === a.id;
                        return (
                          <TouchableOpacity
                            key={a.id}
                            onPress={() => setVerifyForAccountId(a.id)}
                            style={[styles.pill, { backgroundColor: activeSel ? colors.primary : colors.card }]}
                          >
                            <Text style={{ color: activeSel ? '#fff' : colors.text, fontWeight: '700' }}>
                              {a.name} ({a.role})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                  <TextInput
                    value={verifyNote}
                    onChangeText={setVerifyNote}
                    placeholder="Note (optional)"
                    placeholderTextColor="#9CA3AF"
                    style={commonStyles.input}
                  />
                  <Button
                    text="Verify"
                    onPress={() => {
                      if (!verifyForAccountId) return;
                      verifySafety(r.id, verifyForAccountId, verifyNote.trim() || undefined);
                      setVerifyForAccountId(null);
                      setVerifyNote('');
                    }}
                    style={{ width: 'auto', paddingHorizontal: 16 } as any}
                  />
                </>
              ) : null}
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginVertical: 6,
    boxShadow: '0px 8px 14px rgba(0,0,0,0.06)',
  } as any,
});
