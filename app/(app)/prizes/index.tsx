
import { useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';

export default function PrizesScreen() {
  const { prizeDefs, employeePrizes, currentAccount, accounts, giftPrize, createPrizeDef } = useAppState();
  const myPrizes = currentAccount ? employeePrizes.filter((e) => e.ownerAccountId === currentAccount.id) : [];

  const isManagement = currentAccount?.role === 'Management';
  const others = useMemo(() => accounts.filter((a) => a.id !== currentAccount?.id), [accounts, currentAccount]);

  const [expandedPrizeId, setExpandedPrizeId] = useState<string | null>(null);
  const [giftTo, setGiftTo] = useState<string | null>(others[0]?.id || null);
  const [daysAhead, setDaysAhead] = useState<string>('0');

  // Create prize form (management)
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCat, setPCat] = useState('Perks');
  const [pUnlock, setPUnlock] = useState('10');
  const [pHidden, setPHidden] = useState(false);
  const [pActive, setPActive] = useState(true);

  const handleCreatePrize = () => {
    const unlock = Math.max(0, parseInt(pUnlock || '0', 10) || 0);
    if (!pName.trim()) {
      Alert.alert('Missing', 'Enter a prize name.');
      return;
    }
    createPrizeDef({ name: pName.trim(), description: pDesc.trim() || undefined, category: pCat.trim() || undefined, unlockAmount: unlock, isHidden: pHidden, active: pActive } as any);
    setPName('');
    setPDesc('');
    setPCat('Perks');
    setPUnlock('10');
    setPHidden(false);
    setPActive(true);
  };

  const handleScheduleGift = (employeePrizeId: string) => {
    if (!giftTo) {
      Alert.alert('Missing', 'Select a teammate.');
      return;
    }
    const days = Math.max(0, parseInt(daysAhead || '0', 10) || 0);
    const deliveryAt = Date.now() + days * 24 * 3600 * 1000;
    giftPrize(employeePrizeId, giftTo, deliveryAt);
    setExpandedPrizeId(null);
    Alert.alert('Gift scheduled', `Gift will be delivered in ${days} day(s).`);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Prizes</Text>

      {isManagement ? (
        <View style={commonStyles.card}>
          <Text style={[commonStyles.label]}>Create a prize</Text>
          <TextInput value={pName} onChangeText={setPName} placeholder="Name" placeholderTextColor="#9CA3AF" style={commonStyles.input} />
          <TextInput value={pDesc} onChangeText={setPDesc} placeholder="Description (optional)" placeholderTextColor="#9CA3AF" style={[commonStyles.input, { height: 90, textAlignVertical: 'top' }]} multiline />
          <Text style={commonStyles.label}>Category</Text>
          <TextInput value={pCat} onChangeText={setPCat} placeholder="Category" placeholderTextColor="#9CA3AF" style={[commonStyles.input, { width: 200 }]} />
          <Text style={commonStyles.label}>Unlock at (points)</Text>
          <TextInput value={pUnlock} onChangeText={setPUnlock} keyboardType="number-pad" placeholder="10" placeholderTextColor="#9CA3AF" style={[commonStyles.input, { width: 120 }]} />
          <View style={{ flexDirection: 'row', gap: 8 as any, marginVertical: 4 }}>
            {[{ label: 'Hidden', val: true }, { label: 'Visible', val: false }].map((opt) => {
              const active = pHidden === opt.val;
              return (
                <TouchableOpacity key={String(opt.val)} onPress={() => setPHidden(opt.val)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}>
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 as any, marginVertical: 4 }}>
            {[{ label: 'Active', val: true }, { label: 'Inactive', val: false }].map((opt) => {
              const active = pActive === opt.val;
              return (
                <TouchableOpacity key={String(opt.val)} onPress={() => setPActive(opt.val)} style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}>
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button text="Create Prize" onPress={handleCreatePrize} style={{ width: 'auto', paddingHorizontal: 16 } as any} />
        </View>
      ) : null}

      <Text style={[commonStyles.smallText, { marginBottom: 10, marginTop: 8 }]}>Available</Text>
      {prizeDefs.length === 0 ? <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No prizes defined.</Text> : null}
      {prizeDefs.map((p) => (
        <View key={p.id} style={commonStyles.card}>
          <View style={commonStyles.rowBetween}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{p.name}</Text>
            <Text style={commonStyles.tag}>{p.category || 'General'}</Text>
          </View>
          {p.description ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{p.description}</Text> : null}
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{p.isHidden ? 'Hidden goal' : `Unlock at ${p.unlockAmount} pts`}</Text>
        </View>
      ))}

      <View style={{ height: 12 }} />
      <Text style={[commonStyles.smallText, { marginBottom: 10 }]}>Your prizes</Text>
      {myPrizes.length === 0 ? <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No prizes yet.</Text> : null}
      {myPrizes.map((e) => {
        const def = prizeDefs.find((p) => p.id === e.prizeId);
        return (
          <View key={e.id} style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{def?.name || 'Prize'}</Text>
              <TouchableOpacity onPress={() => setExpandedPrizeId((id) => (id === e.id ? null : e.id))}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{expandedPrizeId === e.id ? 'Hide' : 'Gift/Trade'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Unlocked {new Date(e.unlockedAt).toLocaleDateString()}</Text>
            {e.giftedToAccountId ? (
              <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Gift scheduled for {accounts.find((a) => a.id === e.giftedToAccountId)?.name || 'someone'} on {e.deliveryAt ? new Date(e.deliveryAt).toLocaleString() : 'TBD'}</Text>
            ) : null}

            {expandedPrizeId === e.id ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[commonStyles.label]}>Gift to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
                  {others.length === 0 ? (
                    <Text style={commonStyles.smallText}>No teammates available.</Text>
                  ) : (
                    others.map((o) => {
                      const active = giftTo === o.id;
                      return (
                        <TouchableOpacity
                          key={o.id}
                          onPress={() => setGiftTo(o.id)}
                          style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                        >
                          <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{o.name} ({o.role})</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <Text style={[commonStyles.label]}>Deliver in (days)</Text>
                <TextInput
                  value={daysAhead}
                  onChangeText={setDaysAhead}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  style={[commonStyles.input, { width: 120 }]}
                />

                <Button text="Schedule Gift" onPress={() => handleScheduleGift(e.id)} />
              </View>
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
