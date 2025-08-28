
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import { useAppState } from '../../../store/AppStateContext';
import { useRouter } from 'expo-router';
import ProgressDonut from '../../../components/ProgressDonut';
import Button from '../../../components/Button';
import type { TabKey } from '../../../store/types';

const uniqueOnShift = (accounts: any[]) => {
  // Only show each employee once regardless of role; consider statuses on_shift/break/lunch as "on"
  const map = new Map<string, any>();
  accounts.forEach((a) => {
    const isOn = a.status === 'on_shift' || a.status === 'break' || a.status === 'lunch';
    if (!isOn) return;
    const key = a.name.trim().toLowerCase();
    if (!map.has(key)) map.set(key, a);
  });
  return Array.from(map.values());
};

const TAB_MAP: Record<TabKey, { label: string; route: string }> = {
  inventory: { label: 'Inventory', route: '/(app)/inventory' },
  chores: { label: 'Chores', route: '/(app)/chores' },
  objectives: { label: 'Objectives', route: '/(app)/objectives' },
  safety: { label: 'Safety', route: '/(app)/safety' },
  prizes: { label: 'Prizes', route: '/(app)/prizes' },
  messages: { label: 'Messages', route: '/(app)/messages' },
  schedule: { label: 'Schedule', route: '/(app)/schedule' },
  notifications: { label: 'Notifications', route: '/(app)/notifications' },
  requests: { label: 'Requests', route: '/(app)/requests' },
};

function parseTimeToTodayEnd(time: string) {
  const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.getTime();
}

function formatMs(ms: number) {
  if (ms <= 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, accounts, currentAccount, startBreak, startLunch, endStatus, prizeDefs, employeePrizes } = useAppState();
  const [tick, setTick] = useState(0);
  const [breakMin, setBreakMin] = useState<string>('');
  const [lunchMin, setLunchMin] = useState<string>('');

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Inventory rundown
  const lowOrEmpty = useMemo(() => {
    return items
      .map((it) => {
        const pct = it.initialStock > 0 ? Math.round((it.currentStock / it.initialStock) * 100) : 0;
        const status = it.currentStock === 0 ? 'empty' : pct < 30 ? 'low' : pct < 70 ? 'medium' : 'full';
        return { ...it, pct, status };
      })
      .filter((it) => it.status === 'low' || it.status === 'empty');
  }, [items]);

  // Employee status list - derive "off" based on schedule off flag if not currently on break/lunch
  const statusLabel = (acc: any) => {
    if (acc.status === 'break') return 'Break';
    if (acc.status === 'lunch') return 'Lunch';
    const today = new Date();
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()] as 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
    const sched = acc.schedule?.[weekday];
    if (sched?.off) return 'Off';
    return 'On shift';
  };

  const nextDayOff = (acc: any) => {
    const order: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const nowIdx = new Date().getDay();
    for (let i = 0; i < 7; i++) {
      const idx = (nowIdx + i) % 7;
      const key = order[idx];
      if (acc.schedule?.[key]?.off) {
        if (i === 0) return 'Today';
        if (i === 1) return 'Tomorrow';
        return key;
      }
    }
    return 'Unknown';
  };

  // Break/Lunch remaining
  const timeRemaining = () => {
    if (!currentAccount?.statusUntil) return null;
    const ms = currentAccount.statusUntil - Date.now();
    if (ms <= 0) return null;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  // Shift time remaining
  const shiftRemaining = () => {
    if (!currentAccount) return null;
    const today = new Date();
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()] as 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
    const sched = currentAccount.schedule?.[weekday];
    if (!sched || sched.off) return 'Off today';
    const endAt = parseTimeToTodayEnd(sched.end || '17:00');
    const now = Date.now();
    if (now >= endAt) return 'Shift ended';
    return formatMs(endAt - now);
  };

  // Progress towards next prize
  const progressInfo = useMemo(() => {
    const progress = currentAccount?.progress || 0;
    const active = prizeDefs.filter((p) => p.active).sort((a, b) => a.unlockAmount - b.unlockAmount);
    const next = active.find((p) => p.unlockAmount > progress) || null;
    const currentTier = active.filter((p) => p.unlockAmount <= progress).pop() || null;
    const maxTarget = next?.unlockAmount ?? currentTier?.unlockAmount ?? 100;
    const percent = Math.min(100, Math.round((progress / Math.max(1, maxTarget)) * 100));
    return { progress, next, percent };
  }, [currentAccount, prizeDefs]);

  const myPrizes = useMemo(() => {
    return currentAccount ? employeePrizes.filter((e) => e.ownerAccountId === currentAccount.id) : [];
  }, [currentAccount, employeePrizes]);

  const favorites: TabKey[] = useMemo(() => {
    return (currentAccount?.favoriteTabs && currentAccount.favoriteTabs.length > 0
      ? currentAccount.favoriteTabs
      : (['inventory', 'chores', 'notifications', 'requests'] as TabKey[])
    ).slice(0, 4);
  }, [currentAccount]);

  const handleStartBreak = () => {
    const val = parseInt(breakMin, 10);
    if (breakMin && (isNaN(val) || val <= 0)) {
      Alert.alert('Invalid minutes', 'Please enter a positive number.');
      return;
    }
    startBreak(breakMin ? val : undefined);
  };
  const handleStartLunch = () => {
    const val = parseInt(lunchMin, 10);
    if (lunchMin && (isNaN(val) || val <= 0)) {
      Alert.alert('Invalid minutes', 'Please enter a positive number.');
      return;
    }
    startLunch(lunchMin ? val : undefined);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>Home</Text>

      {/* Inventory overview */}
      <View style={commonStyles.card}>
        <View style={commonStyles.rowBetween}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Inventory Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/inventory')} style={styles.linkBtn}>
            <Text style={styles.link}>View</Text>
          </TouchableOpacity>
        </View>
        {lowOrEmpty.length === 0 ? (
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>All good. No low items.</Text>
        ) : (
          lowOrEmpty.slice(0, 5).map((it) => (
            <View key={it.id} style={commonStyles.rowBetween}>
              <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{it.name}</Text>
              <Text style={[commonStyles.smallText, { marginTop: 6, color: it.status === 'empty' ? colors.danger : colors.warning }]}>
                {it.status === 'empty' ? 'Empty' : 'Low'} ({it.pct}%)
              </Text>
            </View>
          ))
        )}
        {lowOrEmpty.length > 5 ? (
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{lowOrEmpty.length - 5} more...</Text>
        ) : null}
      </View>

      {/* My shift status and timers */}
      <View style={commonStyles.card}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>My Status</Text>
        {!currentAccount ? (
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>Sign in to manage your status.</Text>
        ) : (
          <>
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{currentAccount.name}</Text>
            <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Status: {statusLabel(currentAccount)}</Text>
            <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Shift ends in: {shiftRemaining()}</Text>
            {currentAccount.status === 'break' || currentAccount.status === 'lunch' ? (
              <Text style={[commonStyles.smallText, { marginTop: 4 }]}>Time remaining: {timeRemaining() || 'Ending soon...'}</Text>
            ) : null}
            <View style={{ height: 8 }} />
            <View style={commonStyles.rowBetween}>
              <Button
                text={`Start Break${breakMin ? ` (${breakMin}m)` : ''}`}
                onPress={handleStartBreak}
                style={{ width: 'auto', paddingHorizontal: 16 } as any}
              />
              <Button
                text={`Start Lunch${lunchMin ? ` (${lunchMin}m)` : ''}`}
                onPress={handleStartLunch}
                style={{ width: 'auto', paddingHorizontal: 16 } as any}
              />
              <Button
                text="End"
                onPress={() => endStatus()}
                style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.card } as any}
                textStyle={{ color: colors.text }}
              />
            </View>
            <View style={[commonStyles.rowBetween, { marginTop: 8 }]}>
              <View style={{ width: '48%' }}>
                <Text style={commonStyles.smallText}>Break minutes (default {currentAccount.breakDefaultMin ?? 5})</Text>
                <TextInput
                  value={breakMin}
                  onChangeText={setBreakMin}
                  placeholder={`${currentAccount.breakDefaultMin ?? 5}`}
                  placeholderTextColor="#9CA3AF"
                  style={commonStyles.input}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ width: '48%' }}>
                <Text style={commonStyles.smallText}>Lunch minutes (default {currentAccount.lunchDefaultMin ?? 30})</Text>
                <TextInput
                  value={lunchMin}
                  onChangeText={setLunchMin}
                  placeholder={`${currentAccount.lunchDefaultMin ?? 30}`}
                  placeholderTextColor="#9CA3AF"
                  style={commonStyles.input}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Text style={[commonStyles.smallText, { marginTop: 10 }]}>Next day off: {nextDayOff(currentAccount)}</Text>
          </>
        )}
      </View>

      {/* Team status */}
      <View style={commonStyles.card}>
        <View style={commonStyles.rowBetween}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Who's on</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.linkBtn}>
            <Text style={styles.link}>Profiles</Text>
          </TouchableOpacity>
        </View>
        {accounts.length === 0 ? <Text style={[commonStyles.smallText, { marginTop: 6 }]}>No employees yet.</Text> : null}
        {uniqueOnShift(accounts).slice(0, 8).map((a) => (
          <View key={a.id} style={commonStyles.rowBetween}>
            <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{a.name}</Text>
            <Text style={[commonStyles.smallText, { marginTop: 6, color: labelColor(statusLabel(a)) }]}>{statusLabel(a)}</Text>
          </View>
        ))}
        {uniqueOnShift(accounts).length > 8 ? (
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{uniqueOnShift(accounts).length - 8} more...</Text>
        ) : null}
      </View>

      {/* Progress & Achievements */}
      <View style={commonStyles.card}>
        <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 6 }}>Progress</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 as any }}>
          <ProgressDonut size={68} thickness={10} percent={progressInfo.percent} color={colors.accent} />
          <View>
            <Text style={[commonStyles.smallText]}>Points: {progressInfo.progress}</Text>
            <Text style={[commonStyles.smallText]}>
              Next: {progressInfo.next ? `${progressInfo.next.name} at ${progressInfo.next.unlockAmount}` : 'Max tier reached'}
            </Text>
          </View>
        </View>
        <View style={{ height: 10 }} />
        <Text style={{ color: colors.text, fontWeight: '800' }}>Achievements</Text>
        {myPrizes.length === 0 ? (
          <Text style={[commonStyles.smallText, { marginTop: 6 }]}>No prizes yet. Complete chores to earn points.</Text>
        ) : (
          myPrizes.slice(0, 4).map((e) => {
            const def = prizeDefs.find((p) => p.id === e.prizeId);
            return (
              <View key={e.id} style={commonStyles.rowBetween}>
                <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{def?.name || 'Prize'}</Text>
                <Text style={[commonStyles.smallText, { marginTop: 6 }]}>{new Date(e.unlockedAt).toLocaleDateString()}</Text>
              </View>
            );
          })
        )}
        {myPrizes.length > 4 ? (
          <TouchableOpacity onPress={() => router.push('/(app)/prizes')} style={styles.linkBtn}>
            <Text style={styles.link}>View all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick links - customizable */}
      <View style={commonStyles.card}>
        <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 as any, justifyContent: 'space-between' }}>
          {favorites.map((k) => (
            <Button key={k} text={TAB_MAP[k].label} onPress={() => router.push(TAB_MAP[k].route)} style={{ width: '48%' } as any} />
          ))}
        </View>
        <Text style={[commonStyles.smallText, { marginTop: 8 }]}>Customize in Profile › Settings.</Text>
      </View>
    </ScrollView>
  );
}

const labelColor = (status: string) => {
  if (status === 'Break' || status === 'Lunch') return colors.warning;
  if (status === 'Off') return colors.grey;
  return colors.success;
};

const styles = StyleSheet.create({
  linkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  link: {
    color: colors.text,
    fontWeight: '800',
  },
});
