
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Account,
  AppNotification,
  Chore,
  EmployeePrize,
  Item,
  PrizeDefinition,
  RestockRequest,
  Role,
  SwitchRequest,
  Message,
  Objective,
  SafetyRequirement,
} from './types';
import {
  clearAllStorage,
  ensureDeviceId,
  loadAll,
  saveAccounts,
  saveChores,
  saveCurrentAccount,
  saveEmployeePrizes,
  saveItems,
  saveNotifications,
  saveRequests,
  saveRole,
  saveSwitchRequests,
  savePrizeDefs,
  saveMessages,
  saveObjectives,
  saveSafetyRequirements,
} from './storage';

type CreateRequestParams = { itemId: string; quantity: number; immediate: boolean };

const dayKeys: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const defaultSchedule = () => {
  const schedule: any = {};
  dayKeys.forEach((d) => (schedule[d] = { day: d, start: '09:00', end: '17:00', off: d === 'Sun' }));
  return schedule;
};

interface Ctx {
  role: Role | null;
  currentAccount: Account | null;
  accounts: Account[];
  deviceId: string | null;

  items: Item[];
  notifications: AppNotification[];
  requests: RestockRequest[];
  chores: Chore[];
  prizeDefs: PrizeDefinition[];
  employeePrizes: EmployeePrize[];
  switchRequests: SwitchRequest[];
  messages: Message[];
  objectives: Objective[];
  safetyRequirements: SafetyRequirement[];

  // Inventory
  addItem: (input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, patch: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteItem: (id: string) => void;
  updateStock: (id: string, currentStock: number) => void;

  // Requests
  createRequest: (params: CreateRequestParams) => void;
  approveRequest: (id: string, eta?: { days?: number; hours?: number }) => void;
  denyRequest: (id: string) => void;
  cancelRequest: (id: string) => void;
  deleteRequest: (id: string) => void;

  // Auth & Accounts
  loginOrCreateAccount: (params: { role: Role; name: string; password: string }) => Promise<boolean>;
  autoLoginForRole: (role: Role) => Promise<boolean>;
  signOut: () => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;

  // Breaks / Lunch
  startBreak: (minutes?: number) => void;
  startLunch: (minutes?: number) => void;
  endStatus: () => void;

  // Chores & Prizes
  createChore: (c: Omit<Chore, 'id' | 'createdAt' | 'completedByAccountIds'>) => void;
  toggleChoreComplete: (id: string) => void;
  createPrizeDef: (p: Omit<PrizeDefinition, 'id' | 'createdAt' | 'active'> & { active?: boolean }) => void;
  updatePrizeDef: (id: string, patch: Partial<PrizeDefinition>) => void;
  giftPrize: (employeePrizeId: string, toAccountId: string, deliveryAt: number) => void;

  // Objectives (employees & safety create; assignable to Management)
  createObjective: (o: Omit<Objective, 'id' | 'createdAt' | 'status' | 'completedByAccountIds' | 'approvedAt' | 'createdByAccountId' | 'createdByRole'>) => void;
  toggleObjectiveComplete: (id: string) => void;
  approveObjective: (id: string) => void;

  // Safety Requirements
  createSafetyRequirement: (r: Omit<SafetyRequirement, 'id' | 'createdAt' | 'verifications' | 'active' | 'createdByAccountId'> & { active?: boolean }) => void;
  verifySafety: (requirementId: string, forAccountId: string, note?: string) => void;
  setSafetyRequirementActive: (requirementId: string, active: boolean) => void;

  // Schedule
  setSchedule: (accId: string, schedule: Account['schedule']) => void;
  createSwitchRequest: (s: Omit<SwitchRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  approveSwitch: (id: string) => void;
  denySwitch: (id: string) => void;
  cancelSwitch: (id: string) => void;
  completeSwitch: (id: string) => void;

  // Messaging
  sendMessage: (toAccountId: string, content: string) => void;
  markMessageRead: (id: string) => void;

  markNotificationRead: (id: string) => void;

  seedDemo: () => void;
  clearAll: () => void;
}

const AppState = createContext<Ctx>(null as any);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [requests, setRequests] = useState<RestockRequest[]>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [prizeDefs, setPrizeDefs] = useState<PrizeDefinition[]>([]);
  const [employeePrizes, setEmployeePrizes] = useState<EmployeePrize[]>([]);
  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [safetyRequirements, setSafetyRequirements] = useState<SafetyRequirement[]>([]);

  const currentAccount = useMemo(() => accounts.find((a) => a.id === currentAccountId) || null, [accounts, currentAccountId]);
  const isManagement = currentAccount?.role === 'Management';
  const isSafety = currentAccount?.role === 'Safety Personal';

  useEffect(() => {
    (async () => {
      const loaded = await loadAll();
      console.log('Loaded from storage', loaded);
      setItems(loaded.items);
      setNotifications(loaded.notifications);
      setRequests(loaded.requests);
      setRoleState(loaded.role);
      setAccounts(loaded.accounts || []);
      setChores(loaded.chores || []);
      setPrizeDefs(loaded.prizeDefs || []);
      setEmployeePrizes(loaded.employeePrizes || []);
      setSwitchRequests(loaded.switchRequests || []);
      setMessages(loaded.messages || []);
      setCurrentAccountId(loaded.currentAccountId || null);
      const id = loaded.deviceId || (await ensureDeviceId());
      setDeviceId(id);
      setObjectives(loaded.objectives || []);
      setSafetyRequirements(loaded.safetyRequirements || []);
    })();
  }, []);

  // Persistence effects
  useEffect(() => { saveItems(items); }, [items]);
  useEffect(() => { saveNotifications(notifications); }, [notifications]);
  useEffect(() => { saveRequests(requests); }, [requests]);
  useEffect(() => { saveAccounts(accounts); }, [accounts]);
  useEffect(() => { saveChores(chores); }, [chores]);
  useEffect(() => { savePrizeDefs(prizeDefs); }, [prizeDefs]);
  useEffect(() => { saveEmployeePrizes(employeePrizes); }, [employeePrizes]);
  useEffect(() => { saveSwitchRequests(switchRequests); }, [switchRequests]);
  useEffect(() => { saveMessages(messages); }, [messages]);
  useEffect(() => { saveObjectives(objectives); }, [objectives]);
  useEffect(() => { saveSafetyRequirements(safetyRequirements); }, [safetyRequirements]);
  useEffect(() => { saveCurrentAccount(currentAccountId); }, [currentAccountId]);

  useEffect(() => {
    // keep role in sync with current account for legacy parts of UI
    if (currentAccount && role !== currentAccount.role) {
      setRole(currentAccount.role);
    }
  }, [currentAccount, role]);

  // Auto-end break/lunch when timers expire
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const next = accounts.map((a) => {
        if ((a.status === 'break' || a.status === 'lunch') && a.statusUntil && a.statusUntil <= now) {
          changed = true;
          return { ...a, status: 'on_shift', statusUntil: undefined, updatedAt: Date.now() };
        }
        return a;
      });
      if (changed) setAccounts(next);
    }, 30000);
    return () => clearInterval(interval);
  }, [accounts]);

  // Process scheduled gifts when due
  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const updated = employeePrizes.map((e) => {
      if (e.giftedToAccountId && e.deliveryAt && !e.delivered && e.deliveryAt <= now) {
        changed = true;
        const newOwner = e.giftedToAccountId;
        notify({
          type: 'gift_received',
          title: 'Gift Received',
          body: 'A prize was delivered to you.',
          targets: [accounts.find((a) => a.id === newOwner)?.role || 'General Service'],
          data: { employeePrizeId: e.id },
        });
        return { ...e, ownerAccountId: newOwner, delivered: true };
      }
      return e;
    });
    if (changed) setEmployeePrizes(updated);
  }, [employeePrizes, accounts]);

  const setRole = (r: Role | null) => {
    setRoleState(r);
    saveRole(r);
  };

  const statusBands = (it: Item) => {
    const pct = it.initialStock > 0 ? it.currentStock / it.initialStock : 0;
    return {
      empty: it.currentStock === 0,
      low: pct > 0 && pct < 0.3,
      medium: pct >= 0.3 && pct < 0.7,
      full: pct >= 0.7,
    };
  };

  const notify = (n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => {
    const notif: AppNotification = {
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      readBy: [],
      ...n,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Inventory
  const addItem: Ctx['addItem'] = (input) => {
    const it: Item = {
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input,
    };
    setItems((prev) => [it, ...prev]);
  };

  const updateItem: Ctx['updateItem'] = (id, patch) => {
    setItems((prev) => {
      const before = prev.find((x) => x.id === id);
      const next = prev.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x));
      const after = next.find((x) => x.id === id)!;
      if (before && after) {
        const b = statusBands(before);
        const a = statusBands(after);
        if (!b.empty && a.empty) {
          notify({ type: 'empty', title: 'Item Empty', body: `${after.name} is out of stock.`, targets: ['General Service', 'Mechanic', 'Management'], data: { itemId: after.id } });
        } else if (!(b.low || b.empty) && (a.low || a.empty)) {
          notify({ type: 'low', title: 'Low Stock Alert', body: `${after.name} is running low.`, targets: ['General Service', 'Mechanic'], data: { itemId: after.id } });
        }
      }
      return next;
    });
  };

  const updateStock: Ctx['updateStock'] = (id, currentStock) => updateItem(id, { currentStock });

  const deleteItem: Ctx['deleteItem'] = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  // Restock requests
  const createRequest: Ctx['createRequest'] = ({ itemId, quantity, immediate }) => {
    const req: RestockRequest = {
      id: Math.random().toString(36).slice(2),
      itemId,
      quantity,
      immediate,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: role || undefined,
      createdByAccountId: currentAccount?.id,
    };
    setRequests((prev) => [req, ...prev]);
    notify({ type: 'request', title: immediate ? 'Immediate Restock Request' : 'Restock Request', body: `${quantity} units requested`, targets: ['Management'], data: { requestId: req.id, itemId } });
  };

  const approveRequest: Ctx['approveRequest'] = (id, eta) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved', expectedDeliveryAt: Date.now() + ((eta?.days || 0) * 24 + (eta?.hours || 0)) * 3600 * 1000, updatedAt: Date.now() } : r)));
    const r = requests.find((x) => x.id === id);
    if (r) notify({ type: 'request_update', title: 'Request Approved', body: `Your request for ${r.quantity} was approved.`, targets: ['General Service', 'Mechanic'], data: { requestId: id, itemId: r.itemId } });
  };

  const denyRequest: Ctx['denyRequest'] = (id) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'denied', updatedAt: Date.now() } : r)));
    const r = requests.find((x) => x.id === id);
    if (r) notify({ type: 'request_update', title: 'Request Denied', body: `Request for ${r.quantity} was denied.`, targets: ['General Service', 'Mechanic'], data: { requestId: id, itemId: r.itemId } });
  };

  const cancelRequest: Ctx['cancelRequest'] = (id) => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled', updatedAt: Date.now() } : r)));
  const deleteRequest: Ctx['deleteRequest'] = (id) => setRequests((prev) => prev.filter((r) => r.id !== id));

  // Auth
  const loginOrCreateAccount: Ctx['loginOrCreateAccount'] = async ({ role, name, password }) => {
    if (!deviceId) {
      console.log('No device id, cannot login');
      return false;
    }
    const existing = accounts.find((a) => a.role === role && a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.password !== password) return false;
      const updated = accounts.map((a) =>
        a.id === existing.id
          ? {
              ...a,
              deviceId,
              status: a.status || 'on_shift',
              breakDefaultMin: a.breakDefaultMin ?? 5,
              lunchDefaultMin: a.lunchDefaultMin ?? 30,
              favoriteTabs: a.favoriteTabs && a.favoriteTabs.length > 0 ? a.favoriteTabs : ['inventory', 'chores', 'notifications', 'requests'],
            }
          : a
      );
      setAccounts(updated);
      setCurrentAccountId(existing.id);
      setRole(role);
      return true;
    }
    const acc: Account = {
      id: Math.random().toString(36).slice(2),
      deviceId,
      name,
      role,
      password,
      progress: 0,
      schedule: defaultSchedule(),
      status: 'on_shift',
      breakDefaultMin: 5,
      lunchDefaultMin: 30,
      favoriteTabs: ['inventory', 'chores', 'notifications', 'requests'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAccounts((prev) => [acc, ...prev]);
    setCurrentAccountId(acc.id);
    setRole(role);
    return true;
  };

  const autoLoginForRole: Ctx['autoLoginForRole'] = async (r) => {
    if (!deviceId) return false;
    const acc = accounts.find((a) => a.role === r && a.deviceId === deviceId);
    if (!acc) return false;
    setCurrentAccountId(acc.id);
    setRole(r);
    return true;
  };

  const signOut: Ctx['signOut'] = () => {
    setCurrentAccountId(null);
    setRole(null);
  };

  const updateAccount: Ctx['updateAccount'] = (id, patch) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a)));
  };

  // Breaks / Lunch
  const startBreak: Ctx['startBreak'] = (minutes) => {
    if (!currentAccount) return;
    const dur = minutes ?? currentAccount.breakDefaultMin ?? 5;
    const until = Date.now() + dur * 60 * 1000;
    updateAccount(currentAccount.id, { status: 'break', statusUntil: until });
  };
  const startLunch: Ctx['startLunch'] = (minutes) => {
    if (!currentAccount) return;
    const dur = minutes ?? currentAccount.lunchDefaultMin ?? 30;
    const until = Date.now() + dur * 60 * 1000;
    updateAccount(currentAccount.id, { status: 'lunch', statusUntil: until });
  };
  const endStatus: Ctx['endStatus'] = () => {
    if (!currentAccount) return;
    updateAccount(currentAccount.id, { status: 'on_shift', statusUntil: undefined });
  };

  // Messaging
  const sendMessage: Ctx['sendMessage'] = (toAccountId, content) => {
    if (!currentAccount) return;
    const msg: Message = { id: Math.random().toString(36).slice(2), fromAccountId: currentAccount.id, toAccountId, content, createdAt: Date.now() };
    setMessages((prev) => [msg, ...prev]);
    const target = accounts.find((a) => a.id === toAccountId);
    if (target) notify({ type: 'message', title: 'New Message', body: `${currentAccount.name}: ${content.slice(0, 40)}`, targets: [target.role], data: { messageId: msg.id } });
  };
  const markMessageRead: Ctx['markMessageRead'] = (id) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, readAt: Date.now() } : m)));

  // Chores
  const createChore: Ctx['createChore'] = (c) => {
    const ch: Chore = { id: Math.random().toString(36).slice(2), createdAt: Date.now(), completedByAccountIds: [], ...c } as Chore;
    setChores((prev) => [ch, ...prev]);
    const targetRole: Role = c.audience === 'Management' ? 'Management' : 'General Service';
    notify({ type: 'chore_assigned', title: 'New Chore', body: ch.title, targets: [targetRole], data: { choreId: ch.id } });
  };

  const awardUnlockedPrizes = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    if (!acc) return;
    const awards: EmployeePrize[] = [];
    prizeDefs.filter((p) => p.active).forEach((p) => {
      const already = employeePrizes.some((e) => e.prizeId === p.id && e.ownerAccountId === accId);
      if (!already && acc.progress >= p.unlockAmount) {
        awards.push({ id: Math.random().toString(36).slice(2), prizeId: p.id, ownerAccountId: accId, unlockedAt: Date.now() });
        notify({ type: 'prize_awarded', title: 'Prize Unlocked', body: `${p.name} unlocked!`, targets: [acc.role], data: { prizeId: p.id } });
      }
    });
    if (awards.length) setEmployeePrizes((prev) => [...awards, ...prev]);
  };

  const toggleChoreComplete: Ctx['toggleChoreComplete'] = (id) => {
    if (!currentAccount) return;
    setChores((prev) => prev.map((c) => (c.id === id ? { ...c, completedByAccountIds: c.completedByAccountIds.includes(currentAccount.id) ? c.completedByAccountIds.filter((x) => x !== currentAccount.id) : [...c.completedByAccountIds, currentAccount.id] } : c)));
    // If marking complete add points
    const ch = chores.find((c) => c.id === id);
    if (ch && !ch.completedByAccountIds.includes(currentAccount.id)) {
      setAccounts((prev) => prev.map((a) => (a.id === currentAccount.id ? { ...a, progress: a.progress + (ch.points || 1) } : a)));
      notify({ type: 'chore_completed', title: 'Chore Completed', body: `${currentAccount.name} completed ${ch.title}`, targets: ['Management'], data: { choreId: ch.id, accountId: currentAccount.id } });
      setTimeout(() => awardUnlockedPrizes(currentAccount.id), 0);
    }
  };

  const createPrizeDef: Ctx['createPrizeDef'] = (p) => {
    const def: PrizeDefinition = { id: Math.random().toString(36).slice(2), createdAt: Date.now(), active: p.active ?? true, ...p };
    setPrizeDefs((prev) => [def, ...prev]);
    // Notify all roles that a new prize/level is available
    notify({
      type: 'prize_new',
      title: 'New Reward Available',
      body: def.name,
      targets: ['General Service', 'Mechanic', 'Management', 'Safety Personal', 'Alignment Tech'],
      data: { prizeId: def.id },
    });
  };
  const updatePrizeDef: Ctx['updatePrizeDef'] = (id, patch) => setPrizeDefs((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const giftPrize: Ctx['giftPrize'] = (employeePrizeId, toAccountId, deliveryAt) => {
    setEmployeePrizes((prev) => prev.map((e) => (e.id === employeePrizeId ? { ...e, giftedToAccountId: toAccountId, deliveryAt, delivered: false } : e)));
    notify({ type: 'gift_scheduled', title: 'Gift Scheduled', body: 'A prize gift was scheduled.', targets: ['Management'], data: { employeePrizeId, toAccountId, deliveryAt } });
  };

  // Objectives
  const createObjective: Ctx['createObjective'] = (o) => {
    if (!currentAccount) {
      console.log('No account to create objective');
      return;
    }
    const obj: Objective = {
      id: Math.random().toString(36).slice(2),
      title: o.title,
      description: o.description,
      points: o.points ?? 1,
      createdByAccountId: currentAccount.id,
      createdByRole: currentAccount.role,
      assignedToRole: o.assignedToRole,
      assignedToAccountId: o.assignedToAccountId,
      requiresApproval: o.requiresApproval ?? false,
      dueAt: o.dueAt,
      status: 'open',
      completedByAccountIds: [],
      createdAt: Date.now(),
    };
    setObjectives((prev) => [obj, ...prev]);
    notify({
      type: 'objective_assigned',
      title: 'New Objective',
      body: obj.title,
      targets: [obj.assignedToRole],
      data: { objectiveId: obj.id },
    });
  };

  const toggleObjectiveComplete: Ctx['toggleObjectiveComplete'] = (id) => {
    if (!currentAccount) return;
    const obj = objectives.find((o) => o.id === id);
    if (!obj) return;

    const wasCompletedByMe = obj.completedByAccountIds.includes(currentAccount.id);
    const updated = {
      ...obj,
      completedByAccountIds: wasCompletedByMe
        ? obj.completedByAccountIds.filter((x) => x !== currentAccount.id)
        : [...obj.completedByAccountIds, currentAccount.id],
      status: wasCompletedByMe ? obj.status : 'completed',
    };

    setObjectives((prev) => prev.map((o) => (o.id === id ? updated : o)));

    if (!wasCompletedByMe) {
      // Award points to the account completing this objective
      setAccounts((prev) => prev.map((a) => (a.id === currentAccount.id ? { ...a, progress: a.progress + (obj.points || 1) } : a)));
      notify({
        type: 'objective_completed',
        title: 'Objective Completed',
        body: `${currentAccount.name} completed ${obj.title}`,
        targets: ['Management', obj.createdByRole],
        data: { objectiveId: obj.id, accountId: currentAccount.id },
      });
      setTimeout(() => awardUnlockedPrizes(currentAccount.id), 0);
    }
  };

  const approveObjective: Ctx['approveObjective'] = (id) => {
    if (!currentAccount || !isManagement) {
      console.log('Only management can approve objectives');
      return;
    }
    const obj = objectives.find((o) => o.id === id);
    if (!obj) return;

    const updated = { ...obj, status: 'approved', approvedAt: Date.now() };
    setObjectives((prev) => prev.map((o) => (o.id === id ? updated : o)));

    // Award points to the manager approving
    setAccounts((prev) => prev.map((a) => (a.id === currentAccount.id ? { ...a, progress: a.progress + (obj.points || 1) } : a)));
    notify({
      type: 'objective_completed',
      title: 'Objective Approved',
      body: `${currentAccount.name} approved ${obj.title}`,
      targets: ['Management', obj.createdByRole],
      data: { objectiveId: obj.id, accountId: currentAccount.id },
    });
    setTimeout(() => awardUnlockedPrizes(currentAccount.id), 0);
  };

  // Safety Requirements
  const createSafetyRequirement: Ctx['createSafetyRequirement'] = (r) => {
    if (!currentAccount || currentAccount.role !== 'Safety Personal') {
      console.log('Only Safety Personal can create safety requirements');
      return;
    }
    const req: SafetyRequirement = {
      id: Math.random().toString(36).slice(2),
      title: r.title,
      description: r.description,
      createdByAccountId: currentAccount.id,
      targetRole: r.targetRole,
      active: r.active ?? true,
      createdAt: Date.now(),
      verifications: [],
    };
    setSafetyRequirements((prev) => [req, ...prev]);
    notify({
      type: 'safety_requirement_new',
      title: 'New Safety Requirement',
      body: req.title,
      targets: ['Management', r.targetRole],
      data: { safetyRequirementId: req.id },
    });
  };

  const verifySafety: Ctx['verifySafety'] = (requirementId, forAccountId, note) => {
    if (!currentAccount || currentAccount.role !== 'Safety Personal') {
      console.log('Only Safety Personal can verify safety requirements');
      return;
    }
    const req = safetyRequirements.find((s) => s.id === requirementId);
    const targetAcc = accounts.find((a) => a.id === forAccountId);
    if (!req || !targetAcc) return;

    const verification = {
      id: Math.random().toString(36).slice(2),
      byAccountId: currentAccount.id,
      forAccountId,
      note,
      createdAt: Date.now(),
    };

    const updated = { ...req, verifications: [verification, ...req.verifications] };
    setSafetyRequirements((prev) => prev.map((s) => (s.id === requirementId ? updated : s)));

    notify({
      type: 'safety_verified',
      title: 'Safety Verified',
      body: `${targetAcc.name} verified for: ${req.title}`,
      targets: ['Management', targetAcc.role],
      data: { safetyRequirementId: req.id, forAccountId },
    });
  };

  const setSafetyRequirementActive: Ctx['setSafetyRequirementActive'] = (requirementId, active) => {
    setSafetyRequirements((prev) => prev.map((s) => (s.id === requirementId ? { ...s, active } : s)));
  };

  // Schedule
  const setSchedule: Ctx['setSchedule'] = (accId, schedule) => {
    updateAccount(accId, { schedule });
    const acc = accounts.find((a) => a.id === accId);
    if (acc) {
      notify({
        type: 'schedule_update',
        title: 'Schedule Updated',
        body: `Your schedule was updated.`,
        targets: [acc.role],
        data: { accountId: acc.id },
      });
    }
  };

  const createSwitchRequest: Ctx['createSwitchRequest'] = (s) => {
    const req: SwitchRequest = { id: Math.random().toString(36).slice(2), status: 'proposed', createdAt: Date.now(), updatedAt: Date.now(), ...s };
    setSwitchRequests((prev) => [req, ...prev]);
    notify({ type: 'schedule_request', title: 'Schedule Change Requested', body: `${s.type} day on ${s.date}`, targets: ['Management'], data: { switchId: req.id } });
  };
  const approveSwitch: Ctx['approveSwitch'] = (id) => setSwitchRequests((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'approved', updatedAt: Date.now() } : s)));
  const denySwitch: Ctx['denySwitch'] = (id) => setSwitchRequests((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'denied', updatedAt: Date.now() } : s)));
  const cancelSwitch: Ctx['cancelSwitch'] = (id) => setSwitchRequests((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'cancelled', updatedAt: Date.now() } : s)));
  const completeSwitch: Ctx['completeSwitch'] = (id) => setSwitchRequests((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'completed', updatedAt: Date.now() } : s)));

  const markNotificationRead: Ctx['markNotificationRead'] = (id) => {
    const r = role || 'General Service';
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readBy: [...new Set([...n.readBy, r])] } : n)));
  };

  const seedDemo = () => {
    const demo: Item[] = [
      { id: Math.random().toString(36).slice(2), name: 'Oil Filter A1', description: 'Standard oil filter suitable for most sedans.', category: 'General Service', initialStock: 100, currentStock: 22, createdAt: Date.now(), updatedAt: Date.now(), imageUri: 'https://images.unsplash.com/photo-1610641818989-66fea3a28c7d?q=80&w=1000&auto=format&fit=crop' },
      { id: Math.random().toString(36).slice(2), name: 'Brake Pads', description: 'Front brake pads set.', category: 'Mechanic', initialStock: 50, currentStock: 0, createdAt: Date.now(), updatedAt: Date.now(), imageUri: 'https://images.unsplash.com/photo-1625231334168-9e7c7a3330e7?q=80&w=1000&auto=format&fit=crop' },
      { id: Math.random().toString(36).slice(2), name: 'Diagnostics Cable', description: 'OBD-II diagnostic cable.', category: 'Diag', initialStock: 30, currentStock: 21, createdAt: Date.now(), updatedAt: Date.now(), imageUri: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1000&auto=format&fit=crop' },
    ];
    const acc: Account = {
      id: Math.random().toString(36).slice(2),
      deviceId: deviceId || 'dev',
      name: 'Alex',
      role: 'Mechanic',
      password: '1234',
      progress: 0,
      schedule: defaultSchedule(),
      status: 'on_shift',
      breakDefaultMin: 5,
      lunchDefaultMin: 30,
      favoriteTabs: ['inventory', 'chores', 'notifications', 'requests'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setItems(demo);
    setNotifications([]);
    setRequests([]);
    setAccounts([acc]);
    setCurrentAccountId(acc.id);
    setPrizeDefs([
      { id: Math.random().toString(36).slice(2), name: 'Coffee Gift Card', description: '$10 gift card', category: 'Perks', unlockAmount: 50, isHidden: false, active: true, createdAt: Date.now() },
      { id: Math.random().toString(36).slice(2), name: 'Mystery Box', description: 'Hidden prize', category: 'Surprise', unlockAmount: 120, isHidden: true, active: true, createdAt: Date.now() },
    ]);
    setChores([
      { id: Math.random().toString(36).slice(2), title: 'Tidy Alignment Bay', description: 'Sweep and organize tools', audience: 'Crew', points: 10, createdAt: Date.now(), completedByAccountIds: [] },
      { id: Math.random().toString(36).slice(2), title: 'Approve vendor invoice', audience: 'Management', points: 5, createdAt: Date.now(), completedByAccountIds: [] },
    ]);
    setObjectives([
      {
        id: Math.random().toString(36).slice(2),
        title: 'Manager approval of repair order #123',
        description: 'Please review and approve before 5pm.',
        points: 5,
        createdByAccountId: acc.id,
        createdByRole: acc.role,
        assignedToRole: 'Management',
        requiresApproval: true,
        status: 'open',
        completedByAccountIds: [],
        createdAt: Date.now(),
      },
    ]);
    setSafetyRequirements([
      {
        id: Math.random().toString(36).slice(2),
        title: 'Wear eye protection in shop areas',
        description: 'Safety glasses required at all times.',
        createdByAccountId: acc.id,
        targetRole: 'Mechanic',
        active: true,
        createdAt: Date.now(),
        verifications: [],
      },
    ]);
    setEmployeePrizes([]);
    setSwitchRequests([]);
    setRole(acc.role);
  };

  const clearAll = async () => {
    await clearAllStorage();
    setItems([]);
    setNotifications([]);
    setRequests([]);
    setAccounts([]);
    setCurrentAccountId(null);
    setChores([]);
    setPrizeDefs([]);
    setEmployeePrizes([]);
    setSwitchRequests([]);
    setMessages([]);
    setObjectives([]);
    setSafetyRequirements([]);
    setRoleState(null);
  };

  const ctx: Ctx = {
    role,
    currentAccount,
    accounts,
    deviceId,

    items,
    notifications,
    requests,
    chores,
    prizeDefs,
    employeePrizes,
    switchRequests,
    messages,
    objectives,
    safetyRequirements,

    addItem,
    updateItem,
    deleteItem,
    updateStock,

    createRequest,
    approveRequest,
    denyRequest,
    cancelRequest,
    deleteRequest,

    loginOrCreateAccount,
    autoLoginForRole,
    signOut,
    updateAccount,

    // Break/Lunch
    startBreak,
    startLunch,
    endStatus,

    createChore,
    toggleChoreComplete,
    createPrizeDef,
    updatePrizeDef,
    giftPrize,

    // Objectives & Safety
    createObjective,
    toggleObjectiveComplete,
    approveObjective,
    createSafetyRequirement,
    verifySafety,
    setSafetyRequirementActive,

    setSchedule,
    createSwitchRequest,
    approveSwitch,
    denySwitch,
    cancelSwitch,
    completeSwitch,

    markNotificationRead,

    sendMessage,
    markMessageRead,

    seedDemo,
    clearAll,
  };

  return <AppState.Provider value={ctx}>{children}</AppState.Provider>;
};

export const useAppState = () => useContext(AppState);
