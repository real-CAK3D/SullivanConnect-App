
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/commonStyles';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
  count?: number;
}

export default function TabBarIconWithBadge({ name, color = colors.text, size = 22, count = 0 }: Props) {
  const show = typeof count === 'number' && count > 0;
  return (
    <View style={styles.container}>
      <Ionicons name={name} size={size} color={color} />
      {show ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
  } as any,
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '800' },
});
