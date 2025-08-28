
import { useEffect, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';
import Button from './Button';
import { useAppState } from '../store/AppStateContext';
import Constants from 'expo-constants';
import { SUPABASE_URL } from '../app/integrations/supabase/client';
import { useRouter } from 'expo-router';

interface Props {
  open: boolean;
  onClose: () => void;
}

type DbStatus = 'unknown' | 'connected' | 'disconnected';

export default function SettingsSheet({ open, onClose }: Props) {
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['48%'], []);
  const { seedDemo, clearAll, role, signOut, currentAccount } = useAppState();
  const [internalOpen, setInternalOpen] = useState(open);

  const [dbStatus, setDbStatus] = useState<DbStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const router = useRouter();

  if (!internalOpen && open) setInternalOpen(true);

  const backdrop = (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />;

  const checkDb = async () => {
    try {
      setDbStatus('unknown');
      const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { method: 'GET' });
      setDbStatus(res.ok ? 'connected' : 'disconnected');
    } catch (e) {
      console.log('DB health check failed', e);
      setDbStatus('disconnected');
    } finally {
      setLastChecked(Date.now());
    }
  };

  useEffect(() => {
    if (internalOpen) {
      checkDb();
    }
  }, [internalOpen]);

  const appName = Constants.expoConfig?.name || 'App';
  const appSlug = Constants.expoConfig?.slug || 'unknown';
  const appVersion = Constants.expoConfig?.version || '0.0.0';

  const statusColor = dbStatus === 'connected' ? colors.success : dbStatus === 'disconnected' ? colors.danger : colors.grey;

  const handleSignOut = () => {
    signOut();
    setInternalOpen(false);
    onClose();
    router.replace('/(auth)/login');
  };

  return internalOpen ? (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={backdrop}
      onClose={() => {
        setInternalOpen(false);
        onClose();
      }}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: colors.grey }}
      backgroundStyle={{ backgroundColor: colors.background }}
    >
      <BottomSheetView style={{ padding: 16 }}>
        <Text style={[commonStyles.title, { textAlign: 'left' }]}>Settings</Text>
        <Text style={[commonStyles.smallText, { marginBottom: 12 }]}>
          Signed in as {currentAccount ? `${currentAccount.name} (${currentAccount.role})` : role}
        </Text>

        <View style={[commonStyles.card, { width: '100%' }]}>
          <Text style={[commonStyles.label, { marginBottom: 8 }]}>Database</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 as any, marginBottom: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor }} />
            <Text style={commonStyles.smallText}>Status: {dbStatus}</Text>
          </View>
          <Text style={commonStyles.smallText}>URL: {SUPABASE_URL}</Text>
          {lastChecked ? (
            <Text style={commonStyles.smallText}>Checked: {new Date(lastChecked).toLocaleTimeString()}</Text>
          ) : null}
          <View style={{ height: 8 }} />
          <Button text="Check now" onPress={checkDb} style={{ width: 'auto', backgroundColor: colors.card } as any} textStyle={{ color: colors.text }} />
        </View>

        <View style={{ height: 12 }} />
        <Button text="Seed demo data" onPress={seedDemo} />
        <View style={{ height: 8 }} />
        <Button text="Clear all data" onPress={clearAll} style={{ backgroundColor: colors.danger }} />
        <View style={{ height: 8 }} />
        <Button text="Sign out" onPress={handleSignOut} style={{ backgroundColor: colors.card }} />

        <View style={{ height: 16 }} />
        <View style={[commonStyles.card, { width: '100%' }]}>
          <Text style={[commonStyles.smallText]}>
            App: {appName} ({appVersion}) • Slug: {appSlug}
          </Text>
        </View>
      </BottomSheetView>
    </BottomSheet>
  ) : null;
}
