
import { useMemo, useState } from 'react';
import { ScrollView, Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Role } from '../../../store/types';

const assignableRoles: Role[] = ['Management', 'General Service', 'Mechanic', 'Safety Personal', 'Alignment Tech'];

export default function ObjectivesScreen() {
  const { accounts, currentAccount, objectives, createObjective, toggleObjectiveComplete, approveObjective } = useAppState();
  const role = currentAccount?.role || null;
  const isManagement = role === 'Management';

  // Create objective
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [points, setPoints] = useState('1');
  const [assignedRole, setAssignedRole] = useState<Role>('Management');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);

  // Quick Daily Task (Management)
  const [dailyTitle, setDailyTitle] = useState('');
  const [dailyPoints, setDailyPoints] = useState('1');
  const [dailyRole, setDailyRole] = useState<Role>('General Service');

  const assigneesForRole = useMemo(() => accounts.filter((a) => a.role === assignedRole), [accounts, assignedRole]);

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setPoints('1');
    setAssignedRole('Management');
    setAssignee(null);
    setRequiresApproval(true);
    setDueAt(null);
    setShowDate(false);
  };

  const handleCreate = () => {
    const p = Math.max(1, parseInt(points || '1', 10) || 1);
    createObjective({
      title: title.trim(),
      description: desc.trim() || undefined,
      assignedToRole: assignedRole,
      assignedToAccountId: assignee || undefined,
      points: p,
      requiresApproval,
      dueAt: dueAt ? dueAt.getTime() : undefined,
    } as any);
    resetForm();
  };

  const handleCreateDailyTask = () => {
    if (!dailyTitle.trim()) return;
    const p = Math.max(1, parseInt(dailyPoints || '1', 10) || 1);
    const endOfToday = (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    })();
    createObjective({
      title: dailyTitle.trim(),
      description: undefined,
      assignedToRole: dailyRole,
      assignedToAccountId: undefined,
      points: p,
      requiresApproval: false,
      dueAt: endOfToday,
    } as any);
    setDailyTitle('');
    setDailyPoints('1');
    setDailyRole('General Service');
  };

  const myId = currentAccount?.id;
  // Visible list:
  const list = useMemo(() => {
    if (!currentAccount) return [];
    const mineCreated = objectives.filter((o) => o.createdByAccountId === myId);
    const assignedToMe = objectives.filter((o) => o.assignedToAccountId === myId || o.assignedToRole === role);
    const combined = Array.from(new Set([...mineCreated, ...assignedToMe]));
    // Management sees everything
    return (isManagement ? objectives : combined).sort((a, b) => b.createdAt - a.createdAt);
  }, [objectives, currentAccount, isManagement, myId, role]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Objectives</Text>

      {isManagement ? (
        <View style={commonStyles.card}>
          <Text style={[commonStyles.label]}>Quick Daily Task (Management)</Text>
          <TextInput
            value={dailyTitle}
            onChangeText={setDailyTitle}
            placeholder="Daily task title"
            placeholderTextColor="#9CA3AF"
            style={commonStyles.input}
          />
          <Text style={commonStyles.label}>Assign to role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            {(['General Service', 'Mechanic', 'Alignment Tech', 'Safety Personal', 'Management'] as Role[]).map((r) => {
              const active = dailyRole === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setDailyRole(r)}
                  style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={commonStyles.label}>Points</Text>
          <TextInput
            value={dailyPoints}
            onChangeText={setDailyPoints}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            style={[commonStyles.input, { width: 120 }]}
          />
          <Button text="Create Daily Task" onPress={handleCreateDailyTask} style={{ width: 'auto', paddingHorizontal: 16 } as any} />
        </View>
      ) : null}

      {/* Create objective (all roles) */}
      <View style={commonStyles.card}>
        <Text style={[commonStyles.label]}>Create an objective</Text>
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
          style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
        />
        <Text style={commonStyles.label}>Assign to role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          {assignableRoles.map((r) => {
            const active = assignedRole === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => {
                  setAssignedRole(r);
                  setAssignee(null);
                }}
                style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={commonStyles.label}>Assign to (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          <TouchableOpacity
            onPress={() => setAssignee(null)}
            style={[styles.pill, { backgroundColor: assignee ? colors.card : colors.primary }]}
          >
            <Text style={{ color: assignee ? colors.text : '#fff', fontWeight: '700' }}>Anyone in {assignedRole}</Text>
          </TouchableOpacity>
          {assigneesForRole.map((a) => {
            const active = assignee === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => setAssignee(a.id)}
                style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{a.name}</Text>
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

        <Text style={commonStyles.label}>Requires manager approval?</Text>
        <View style={{ flexDirection: 'row', gap: 8 as any }}>
          {[
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ].map((opt) => {
            const active = requiresApproval === opt.value;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => setRequiresApproval(opt.value)}
                style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={commonStyles.label}>Due date (optional)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 as any }}>
          <Button
            text={dueAt ? new Date(dueAt).toLocaleString() : 'Pick date'}
            onPress={() => setShowDate(true)}
            style={{ width: 'auto', paddingHorizontal: 16 } as any}
          />
          {dueAt ? (
            <Button
              text="Clear"
              onPress={() => setDueAt(null)}
              style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
              textStyle={{ color: colors.text }}
            />
          ) : null}
        </View>
        {showDate ? (
          <DateTimePicker
            value={dueAt || new Date()}
            mode="date"
            onChange={(ev: any) => {
              setShowDate(false);
              if (ev?.nativeEvent?.timestamp) {
                const d = new Date(ev.nativeEvent.timestamp);
                setDueAt(d);
              }
            }}
          />
        ) : null}

        <View style={{ height: 8 }} />
        <Button text="Create Objective" onPress={handleCreate} style={{ width: 'auto', paddingHorizontal: 16 } as any} />
      </View>

      {/* List */}
      {list.length === 0 ? (
        <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No objectives.</Text>
      ) : null}
      {list.map((o) => {
        const completedByMe = currentAccount ? o.completedByAccountIds.includes(currentAccount.id) : false;
        const needsApproval = o.requiresApproval && o.status !== 'approved';
        const canApprove = isManagement && (o.status === 'completed' || (o.requiresApproval && o.status !== 'approved'));
        const canComplete =
          !!currentAccount &&
          (o.assignedToAccountId ? o.assignedToAccountId === currentAccount.id : o.assignedToRole === currentAccount.role);

        return (
          <View key={o.id} style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{o.title}</Text>
              <Text style={commonStyles.tag}>{o.status.toUpperCase()}</Text>
            </View>
            {o.description ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{o.description}</Text> : null}
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Points: {o.points}</Text>
            {o.dueAt ? <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Due: {new Date(o.dueAt).toLocaleString()}</Text> : null}
            <View style={{ height: 8 }} />
            <View style={commonStyles.rowBetween}>
              <View style={{ flexDirection: 'row', gap: 8 as any }}>
                {canComplete ? (
                  <Button
                    text={completedByMe ? 'Mark Incomplete' : 'Mark Complete'}
                    onPress={() => toggleObjectiveComplete(o.id)}
                    style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: completedByMe ? colors.card : colors.primary } as any}
                    textStyle={{ color: completedByMe ? colors.text : '#fff' }}
                  />
                ) : (
                  <View />
                )}
              </View>
              {canApprove ? (
                <Button
                  text={needsApproval ? 'Approve' : 'Approve'}
                  onPress={() => approveObjective(o.id)}
                  style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.secondary } as any}
                  textStyle={{ color: colors.text }}
                />
              ) : (
                <View />
              )}
            </View>
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
