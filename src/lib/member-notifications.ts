export type NotificationPrefs = {
  orders: boolean;
  clubNews: boolean;
  email: boolean;
};

const PREFS_KEY = "verda-member-notif-prefs";

export const defaultNotificationPrefs: NotificationPrefs = {
  orders: true,
  clubNews: true,
  email: true,
};

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaultNotificationPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultNotificationPrefs;
    return { ...defaultNotificationPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultNotificationPrefs;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export type MemberNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

const READ_KEY = "verda-member-notif-read";

export function loadReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markNotificationRead(id: string) {
  const read = loadReadNotificationIds();
  read.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...read]));
}

export function markAllNotificationsRead(ids: string[]) {
  const read = loadReadNotificationIds();
  ids.forEach((id) => read.add(id));
  localStorage.setItem(READ_KEY, JSON.stringify([...read]));
}
