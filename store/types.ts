
export type Role =
  | 'General Service'
  | 'Mechanic'
  | 'Management'
  | 'Safety Personal'
  | 'Alignment Tech';

export interface Item {
  id: string;
  name: string;
  description?: string;
  category: 'Store' | 'General Service' | 'Diag' | 'Alignments' | 'Electrical' | 'Mechanic';
  initialStock: number; // Acts as max stock threshold
  currentStock: number;
  imageUri?: string;
  createdAt: number;
  updatedAt: number;
  createdByAccountId?: string; // to restrict edit/delete to uploader or management
}

export type NotificationType =
  | 'low'
  | 'empty'
  | 'request'
  | 'request_update'
  | 'schedule_request'
  | 'schedule_update'
  | 'chore_assigned'
  | 'chore_completed'
  | 'objective_assigned'
  | 'objective_completed'
  | 'safety_requirement_new'
  | 'safety_verified'
  | 'prize_new'
  | 'prize_awarded'
  | 'gift_scheduled'
  | 'gift_received'
  | 'message';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targets: Role[]; // who should see this
  createdAt: number;
  readBy: Role[]; // roles who read it
  data?: any;
}

export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled' | 'deleted';

export interface RestockRequest {
  id: string;
  itemId: string;
  quantity: number;
  immediate: boolean;
  createdAt: number;
  status: RequestStatus;
  expectedDeliveryAt?: number; // timestamp
  updatedAt: number;
  createdBy?: Role;
  createdByAccountId?: string;
  isExcess?: boolean; // indicates amount beyond max stock threshold
  decisionNote?: string; // reason on deny/cancel/delete
}

export type EmployeeStatus = 'off' | 'on_shift' | 'break' | 'lunch';

export type TabKey =
  | 'inventory'
  | 'chores'
  | 'objectives'
  | 'safety'
  | 'prizes'
  | 'messages'
  | 'schedule'
  | 'notifications'
  | 'requests';

export interface Account {
  id: string;
  deviceId: string;
  name: string;
  role: Role;
  password: string; // stored locally only
  email?: string; // optional
  phone?: string; // optional
  avatarUri?: string; // local image uri
  progress: number; // progress points for prizes
  schedule: WeeklySchedule;
  status?: EmployeeStatus; // current working status
  statusUntil?: number; // timestamp when break/lunch ends
  breakDefaultMin?: number; // default break duration
  lunchDefaultMin?: number; // default lunch duration
  favoriteTabs?: TabKey[]; // up to 4 quick links on Home
  createdAt: number;
  updatedAt: number;
}

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export interface DayHours {
  day: DayKey;
  start: string; // HH:mm
  end: string; // HH:mm
  off?: boolean;
}
export type WeeklySchedule = Record<DayKey, DayHours>;

export type ChoreAudience = 'Management' | 'Crew';
export interface Chore {
  id: string;
  title: string;
  description?: string;
  audience: ChoreAudience;
  points: number; // progress points awarded when completed
  assignedToAccountId?: string; // optional direct assignment
  createdByAccountId?: string;
  dueAt?: number; // optional deadline timestamp
  createdAt: number;
  completedByAccountIds: string[];
}

export interface PrizeDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unlockAmount: number; // progress needed
  isHidden: boolean; // hide unlock amount from employees
  active: boolean;
  createdAt: number;
}

export interface EmployeePrize {
  id: string;
  prizeId: string;
  ownerAccountId: string;
  unlockedAt: number;
  giftedToAccountId?: string;
  deliveryAt?: number; // timestamp in future for scheduled gift
  delivered?: boolean;
}

export interface Message {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  content: string;
  createdAt: number;
  readAt?: number;
}

export type SwitchStatus = 'proposed' | 'approved' | 'denied' | 'cancelled' | 'completed';
export interface SwitchRequest {
  id: string;
  requesterId: string;
  partnerId?: string; // optional specific partner
  date: string; // ISO date string (day)
  type: 'work' | 'off';
  note?: string;
  status: SwitchStatus;
  createdAt: number;
  updatedAt: number;
}

export type ObjectiveStatus = 'open' | 'completed' | 'approved';
export interface Objective {
  id: string;
  title: string;
  description?: string;
  points: number; // points awarded to the account who completes/approves
  createdByAccountId: string;
  createdByRole: Role;
  assignedToRole: Role; // often Management for approvals
  assignedToAccountId?: string; // optional direct assignment
  requiresApproval?: boolean; // if true, Management can approve
  dueAt?: number;
  status: ObjectiveStatus;
  completedByAccountIds: string[]; // who marked complete
  approvedAt?: number; // when management approved
  createdAt: number;
}

export interface SafetyVerification {
  id: string;
  byAccountId: string; // the Safety Personal who verified
  forAccountId: string; // the person being verified as compliant
  note?: string;
  createdAt: number;
}

export interface SafetyRequirement {
  id: string;
  title: string;
  description?: string;
  createdByAccountId: string; // must be Safety Personal
  targetRole: Role; // who this requirement applies to
  active: boolean;
  createdAt: number;
  verifications: SafetyVerification[]; // history of verifications
}
