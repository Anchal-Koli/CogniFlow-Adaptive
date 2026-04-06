import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  leaderboard as defaultLeaderboard,
  notifications as defaultNotifications,
} from "@/data/dummy";
import type { Notification } from "@/data/dummy";

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
}

interface SocialState {
  leaderboard: LeaderboardEntry[];
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  unreadCount: () => number;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      leaderboard: defaultLeaderboard,
      notifications: defaultNotifications,

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addNotification: (notification) =>
        set((s) => ({
          notifications: [
            { ...notification, id: `n-${Date.now()}` },
            ...s.notifications,
          ],
        })),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "cogniflow-social" }
  )
);
