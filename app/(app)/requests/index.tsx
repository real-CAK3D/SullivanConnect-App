
import { Alert, ScrollView, Text, View } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import { useAppState } from '../../../store/AppStateContext';
import Button from '../../../components/Button';

export default function RequestsScreen() {
  const { role, items, requests, approveRequest, denyRequest, cancelRequest, deleteRequest, currentAccount } = useAppState();

  const list = requests
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter(() => true);

  const now = Date.now();

  const canDelete = (reqId: string) => {
    const r = requests.find((x) => x.id === reqId);
    if (!r) return false;
    if (role === 'Management') return true;
    if (currentAccount && r.createdByAccountId === currentAccount.id) return true;
    return false;
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete request', 'Are you sure you want to permanently delete this request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRequest(id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {list.length === 0 ? <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No requests.</Text> : null}
      {list.map((r) => {
        const item = items.find((i) => i.id === r.itemId);
        const etaText =
          r.status === 'approved' && r.expectedDeliveryAt
            ? `${Math.max(0, Math.ceil((r.expectedDeliveryAt - now) / (1000 * 60 * 60 * 24)))}d remaining`
            : r.status === 'approved'
            ? 'ETA not set'
            : null;

        return (
          <View key={r.id} style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {item?.name || 'Unknown item'} {r.immediate ? '(Immediate)' : ''}
              </Text>
              <Text style={[commonStyles.tag]}>{r.status.toUpperCase()}</Text>
            </View>
            <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Qty: {r.quantity}</Text>
            {etaText ? <Text style={[commonStyles.smallText, { marginTop: 4 }]}>ETA: {etaText}</Text> : null}
            <View style={{ height: 8 }} />
            {role === 'Management' ? (
              <View style={commonStyles.rowBetween}>
                <Button
                  text="Approve (3d)"
                  onPress={() => approveRequest(r.id, { days: 3 })}
                  style={{ width: 'auto', paddingHorizontal: 16 } as any}
                />
                <Button
                  text="Approve (7d)"
                  onPress={() => approveRequest(r.id, { days: 7 })}
                  style={{ width: 'auto', paddingHorizontal: 16 } as any}
                />
                <Button
                  text="Deny"
                  onPress={() => denyRequest(r.id)}
                  style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.danger } as any}
                />
              </View>
            ) : (
              <View style={commonStyles.rowBetween}>
                <View />
                {(r.status === 'pending' || r.status === 'approved') ? (
                  <Button
                    text="Cancel"
                    onPress={() => cancelRequest(r.id)}
                    style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
                  />
                ) : null}
              </View>
            )}
            <View style={{ height: 8 }} />
            {canDelete(r.id) ? (
              <View style={commonStyles.rowBetween}>
                <View />
                <Button
                  text="Delete"
                  onPress={() => handleDelete(r.id)}
                  style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
                  textStyle={{ color: colors.danger }}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
