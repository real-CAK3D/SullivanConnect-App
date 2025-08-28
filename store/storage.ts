
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  items: 'inv_items_v1',
  notifs: 'inv_notifs_v1',
  reqs: 'inv_reqs_v1',
  role: 'inv_role_v1',
  accounts: 'inv_accounts_v1',
  chores: 'inv_chores_v1',
  prizes: 'inv_prizes_v1',
  employeePrizes: 'inv_employee_prizes_v1',
  switches: 'inv_switches_v1',
  messages: 'inv_messages_v1',
  objectives: 'inv_objectives_v1',
  safetyRequirements: 'inv_safety_requirements_v1',
  deviceId: 'device_id_v1',
  currentAccount: 'current_account_v1',
};

function safeParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.log('Failed to parse JSON from storage. Returning fallback. Value=', str?.slice(0, 100));
    return fallback;
  }
}

export async function loadAll() {
  const [
    itemsStr,
    notifsStr,
    reqsStr,
    roleStr,
    accStr,
    choresStr,
    prizesStr,
    eprStr,
    swStr,
    msgStr,
    objStr,
    safeStr,
    devStr,
    curAccStr,
  ] = await Promise.all([
    AsyncStorage.getItem(KEYS.items),
    AsyncStorage.getItem(KEYS.notifs),
    AsyncStorage.getItem(KEYS.reqs),
    AsyncStorage.getItem(KEYS.role),
    AsyncStorage.getItem(KEYS.accounts),
    AsyncStorage.getItem(KEYS.chores),
    AsyncStorage.getItem(KEYS.prizes),
    AsyncStorage.getItem(KEYS.employeePrizes),
    AsyncStorage.getItem(KEYS.switches),
    AsyncStorage.getItem(KEYS.messages),
    AsyncStorage.getItem(KEYS.objectives),
    AsyncStorage.getItem(KEYS.safetyRequirements),
    AsyncStorage.getItem(KEYS.deviceId),
    AsyncStorage.getItem(KEYS.currentAccount),
  ]);

  return {
    items: safeParse(itemsStr, [] as any[]),
    notifications: safeParse(notifsStr, [] as any[]),
    requests: safeParse(reqsStr, [] as any[]),
    role: safeParse(roleStr, null as any),
    accounts: safeParse(accStr, [] as any[]),
    chores: safeParse(choresStr, [] as any[]),
    prizeDefs: safeParse(prizesStr, [] as any[]),
    employeePrizes: safeParse(eprStr, [] as any[]),
    switchRequests: safeParse(swStr, [] as any[]),
    messages: safeParse(msgStr, [] as any[]),
    objectives: safeParse(objStr, [] as any[]),
    safetyRequirements: safeParse(safeStr, [] as any[]),
    deviceId: devStr || null,
    currentAccountId: curAccStr || null,
  } as any;
}

export async function ensureDeviceId() {
  let id = await AsyncStorage.getItem(KEYS.deviceId);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await AsyncStorage.setItem(KEYS.deviceId, id);
  }
  return id;
}

export async function saveItems(items: any[]) {
  await AsyncStorage.setItem(KEYS.items, JSON.stringify(items));
}
export async function saveNotifications(notifs: any[]) {
  await AsyncStorage.setItem(KEYS.notifs, JSON.stringify(notifs));
}
export async function saveRequests(reqs: any[]) {
  await AsyncStorage.setItem(KEYS.reqs, JSON.stringify(reqs));
}
export async function saveRole(role: any) {
  if (role) await AsyncStorage.setItem(KEYS.role, JSON.stringify(role));
  else await AsyncStorage.removeItem(KEYS.role);
}
export async function saveAccounts(list: any[]) {
  await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(list));
}
export async function saveChores(list: any[]) {
  await AsyncStorage.setItem(KEYS.chores, JSON.stringify(list));
}
export async function savePrizeDefs(list: any[]) {
  await AsyncStorage.setItem(KEYS.prizes, JSON.stringify(list));
}
export async function saveEmployeePrizes(list: any[]) {
  await AsyncStorage.setItem(KEYS.employeePrizes, JSON.stringify(list));
}
export async function saveSwitchRequests(list: any[]) {
  await AsyncStorage.setItem(KEYS.switches, JSON.stringify(list));
}
export async function saveMessages(list: any[]) {
  await AsyncStorage.setItem(KEYS.messages, JSON.stringify(list));
}
export async function saveObjectives(list: any[]) {
  await AsyncStorage.setItem(KEYS.objectives, JSON.stringify(list));
}
export async function saveSafetyRequirements(list: any[]) {
  await AsyncStorage.setItem(KEYS.safetyRequirements, JSON.stringify(list));
}

export async function saveCurrentAccount(id: string | null) {
  if (id) await AsyncStorage.setItem(KEYS.currentAccount, id);
  else await AsyncStorage.removeItem(KEYS.currentAccount);
}

export async function clearAllStorage() {
  await Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k)));
}
