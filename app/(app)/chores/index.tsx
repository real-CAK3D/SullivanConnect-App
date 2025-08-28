
import { useMemo, useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ChoresScreen() {
  const { chores, toggleChoreComplete, currentAccount, accounts, createChore } = useAppState();
  const role = currentAccount?.role || null;
  const isManagement = role === 'Management';

  // Creation form (management only)
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState('1');
  const [audience, setAudience] = useState<'Crew' | 'Management'>('Crew');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const crewAccounts = useMemo(() => accounts.filter((a) => a.role !== 'Management'), [accounts]);
  const myId = currentAccount?.id;

  // Filter chores per role:
  const visibleChores = useMemo(() => {
    if (!currentAccount) return [];
    if (isManagement) return chores.sort((a, b) => (b.createdAt - a.createdAt));
    // Crew sees chores for Crew or directly assigned to them
    return chores
      .filter((c) => c.audience === 'Crew' || c.assignedToAccountId === myId)
      .sort((a, b) => (b.createdAt - a.createdAt));
  }, [chores, currentAccount, isManagement, myId]);

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setPoints('1');
    setAudience('Crew');
    setAssignee(null);
    setDueDate(null);
    setShowDate(false);
  };

  const handleCreateChore = () => {
    const p = Math.max(1, parseInt(points || '1', 10) || 1);
    createChore({
      title: title.trim(),
      description: desc.trim() || undefined,
      audience,
      points: p,
      assignedToAccountId: assignee || undefined,
      dueAt: dueDate ? dueDate.getTime() : undefined,
      createdByAccountId: currentAccount?.id,
    } as any);
    resetForm();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Chores</Text>

      {isManagement ? (
        <View style={commonStyles.card}>
          <Text style={[commonStyles.label]}>Create a chore</Text>
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
          <Text style={commonStyles.label}>Audience</Text>
          <View style={{ flexDirection: 'row', gap: 8 as any }}>
            {(['Crew', 'Management'] as const).map((aud) => {
              const active = audience === aud;
              return (
                <TouchableOpacity
                  key={aud}
                  onPress={() => setAudience(aud)}
                  style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{aud}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={commonStyles.label}>Assign to (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            <TouchableOpacity
              onPress={() => setAssignee(null)}
              style={[styles.pill, { backgroundColor: assignee ? colors.card : colors.primary }]}
            >
              <Text style={{ color: assignee ? colors.text : '#fff', fontWeight: '700' }}>Anyone</Text>
            </TouchableOpacity>
            {crewAccounts.map((a) => {
              const active = assignee === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setAssignee(a.id)}
                  style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{a.name} ({a.role})</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={commonStyles.label}>Points</Text>
          <TextInput
            value={points}
            onChangeText={setPoints}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            style={[commonStyles.input, { width: 120 }]}
          />

          <Text style={commonStyles.label}>Due date (optional)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 as any }}>
            <Button
              text={dueDate ? new Date(dueDate).toLocaleString() : 'Pick date'}
              onPress={() => setShowDate(true)}
              style={{ width: 'auto', paddingHorizontal: 16 } as any}
            />
            {dueDate ? (
              <Button
                text="Clear"
                onPress={() => setDueDate(null)}
                style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
                textStyle={{ color: colors.text }}
              />
            ) : null}
          </View>
          {showDate ? (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              onChange={(ev: any) => {
                setShowDate(false);
                if (ev?.nativeEvent?.timestamp) {
                  const d = new Date(ev.nativeEvent.timestamp);
                  // also ask for time if platform allows
                  if (Platform.OS === 'ios') {
                    setDueDate(d);
                  } else {
                    setDueDate(d);
                  }
                }
              }}
            />
          ) : null}

          <View style={{ height: 8 }} />
          <Button
            text="Create Chore"
            onPress={handleCreateChore}
            style={{ width: 'auto', paddingHorizontal: 16 } as any}
          />
        </View>
      ) : null}

      {visibleChores.length === 0 ? <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No chores yet.</Text> : null}
      {visibleChores.map((c) => {
        const completed = currentAccount ? c.completedByAccountIds.includes(currentAccount.id) : false;
        const dueText = c.dueAt ? new Date(c.dueAt).toLocaleString() : null;
        const assigneeName = c.assignedToAccountId ? accounts.find((a) => a.id === c.assignedToAccountId)?.name : null;
        return (
          <View key={c.id} style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{c.title}</Text>
              <Text style={commonStyles.tag}>{c.audience}</Text>
            </View>
            {assigneeName ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Assigned to: {assigneeName}</Text> : null}
            {c.description ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{c.description}</Text> : null}
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Points: {c.points}</Text>
            {dueText ? <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Due: {dueText}</Text> : null}
            <View style={{ height: 8 }} />
            {currentAccount ? (
              <Button
                text={completed ? 'Mark Incomplete' : 'Mark Complete'}
                onPress={() => toggleChoreComplete(c.id)}
                style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: completed ? colors.card : colors.primary } as any}
                textStyle={{ color: completed ? colors.text : '#fff' }}
              />
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
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
});
