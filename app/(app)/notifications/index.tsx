
import { ScrollView, Text, View } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import { useAppState } from '../../../store/AppStateContext';
import Button from '../../../components/Button';

export default function NotificationsScreen() {
  const { role, notifications, markNotificationRead } = useAppState();
  const list = notifications
    .filter((n) => n.targets.includes(role!))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {list.length === 0 ? <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>No notifications.</Text> : null}
      {list.map((n) => {
        const bg =
          n.type === 'empty'
            ? '#FEE2E2'
            : n.type === 'low'
            ? '#FEF3C7'
            : n.type === 'request'
            ? '#DBEAFE'
            : '#E5E7EB';
        return (
          <View key={n.id} style={[commonStyles.card, { backgroundColor: bg }]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{n.title}</Text>
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{n.body}</Text>
            {!n.readBy.includes(role!) ? (
              <View style={{ marginTop: 8 }}>
                <Button
                  text="Mark as read"
                  onPress={() => markNotificationRead(n.id)}
                  style={{ width: 'auto', paddingHorizontal: 16 } as any}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
