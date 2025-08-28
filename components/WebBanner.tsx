
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';

interface WebBannerProps {
  onOpenSettings?: () => void;
}

export default function WebBanner({ onOpenSettings }: WebBannerProps) {
  if (Platform.OS !== 'web') return null;

  const setEmulate = (target: 'ios' | 'android' | null) => {
    try {
      if (target) {
        localStorage.setItem('emulated_device', target);
      } else {
        localStorage.removeItem('emulated_device');
      }
      // Reload to apply safe area emulation from RootLayout
      window.location.reload();
    } catch (e) {
      console.log('Failed to set emulate target', e);
    }
  };

  let current: string | null = null;
  try {
    current = localStorage.getItem('emulated_device');
  } catch (e) {
    console.log('Failed to read emulate flag', e);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>
        Web Preview Active
      </Text>
      <View style={styles.divider} />
      <Text style={styles.subtext}>
        Emulate safe area:
      </Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.pill, current === 'ios' ? styles.pillActive : styles.pillInactive]}
          onPress={() => setEmulate('ios')}
        >
          <Text style={[styles.pillText, current === 'ios' ? styles.pillTextActive : styles.pillTextInactive]}>iOS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, current === 'android' ? styles.pillActive : styles.pillInactive]}
          onPress={() => setEmulate('android')}
        >
          <Text style={[styles.pillText, current === 'android' ? styles.pillTextActive : styles.pillTextInactive]}>Android</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, !current ? styles.pillActive : styles.pillInactive]}
          onPress={() => setEmulate(null)}
        >
          <Text style={[styles.pillText, !current ? styles.pillTextActive : styles.pillTextInactive]}>None</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
        <Text style={styles.settingsText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 as any,
  },
  text: {
    color: colors.text,
    fontWeight: '800',
  },
  subtext: {
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#E5E7EB',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8 as any,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.card,
  },
  pillText: {
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: colors.text,
  },
  settingsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    marginLeft: 'auto',
  },
  settingsText: {
    color: colors.text,
    fontWeight: '800',
  },
});
