
import { useMemo, useState } from 'react';
import { ScrollView, Text, View, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, commonStyles } from '../../../styles/commonStyles';
import { useAppState } from '../../../store/AppStateContext';
import Button from '../../../components/Button';

export default function ScheduleScreen() {
  const { currentAccount, createSwitchRequest, switchRequests } = useAppState();
  const schedule = currentAccount?.schedule;

  // Time off request
  const [offDate, setOffDate] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [note, setNote] = useState('');

  const myRequests = useMemo(() => {
    if (!currentAccount) return [];
    return switchRequests.filter((r) => r.requesterId === currentAccount.id).sort((a, b) => b.createdAt - a.createdAt);
  }, [switchRequests, currentAccount]);

  const submitTimeOff = () => {
    if (!currentAccount || !offDate) return;
    const iso = offDate.toISOString().slice(0, 10);
    createSwitchRequest({
      requesterId: currentAccount.id,
      partnerId: undefined,
      date: iso,
      type: 'off',
      note: note.trim() || undefined,
    } as any);
    setOffDate(null);
    setNote('');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Schedule</Text>
      {!schedule ? (
        <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No schedule available.</Text>
      ) : (
        Object.keys(schedule).map((k) => {
          const day = schedule[k as keyof typeof schedule];
          return (
            <View key={k} style={commonStyles.card}>
              <View style={commonStyles.rowBetween}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{day.day}</Text>
                <Text style={commonStyles.tag}>{day.off ? 'Off' : `${day.start} - ${day.end}`}</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 16 }} />

      <View style={commonStyles.card}>
        <Text style={[commonStyles.label]}>Request time off</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 as any }}>
          <Button
            text={offDate ? new Date(offDate).toLocaleDateString() : 'Pick date'}
            onPress={() => setShowDate(true)}
            style={{ width: 'auto', paddingHorizontal: 16 } as any}
          />
          {offDate ? (
            <Button
              text="Clear"
              onPress={() => setOffDate(null)}
              style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
              textStyle={{ color: colors.text }}
            />
          ) : null}
        </View>
        {showDate ? (
          <DateTimePicker
            value={offDate || new Date()}
            mode="date"
            onChange={(ev: any) => {
              setShowDate(false);
              if (ev?.nativeEvent?.timestamp) {
                const d = new Date(ev.nativeEvent.timestamp);
                setOffDate(d);
              }
            }}
          />
        ) : null}

        <Text style={[commonStyles.label, { marginTop: 10 }]}>Reason (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Short note"
          placeholderTextColor="#9CA3AF"
          style={commonStyles.input}
        />

        <Button
          text="Submit Time Off Request"
          onPress={submitTimeOff}
          style={{ width: 'auto', paddingHorizontal: 16 } as any}
        />
      </View>

      <View style={{ height: 12 }} />
      <Text style={[commonStyles.smallText, { marginBottom: 8 }]}>My recent requests</Text>
      {myRequests.length === 0 ? (
        <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No requests yet.</Text>
      ) : null}
      {myRequests.map((r) => (
        <View key={r.id} style={commonStyles.card}>
          <View style={commonStyles.rowBetween}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{r.type === 'off' ? 'Time Off' : 'Work Day'} on {r.date}</Text>
            <Text style={commonStyles.tag}>{r.status.toUpperCase()}</Text>
          </View>
          {r.note ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{r.note}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}
