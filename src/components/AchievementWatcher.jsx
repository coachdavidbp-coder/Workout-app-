import { useEffect } from "react";
import { useStore } from "../store.jsx";
import { totalXP, levelInfo, badges } from "../lib/gamify.js";
import { toast } from "../lib/toast.js";
import { haptic } from "../lib/fx.js";

// Watches derived level + badges and toasts when new ones are earned.
// First run initializes "seen" silently so imported/seeded data doesn't spam.
export default function AchievementWatcher() {
  const { state, actions } = useStore();

  useEffect(() => {
    const lvl = levelInfo(totalXP(state)).level;
    const earned = badges(state).filter((b) => b.earned);
    const earnedIds = earned.map((b) => b.id);
    const g = state.game || {};

    if (!g.seenInit) {
      actions.syncSeen(lvl, earnedIds); // silent baseline
      return;
    }

    const leveledUp = lvl > (g.seenLevel || 1);
    const newBadges = earned.filter((b) => !(g.seenBadges || []).includes(b.id));

    if (leveledUp) {
      toast({ emoji: "⭐", title: `Level ${lvl}`, sub: levelInfo(totalXP(state)).title, tone: "good" });
      haptic("success");
    }
    newBadges.forEach((b) =>
      toast({ emoji: b.emoji, title: "Achievement unlocked", sub: b.name, tone: "good" })
    );
    if (newBadges.length) haptic("success");

    if (leveledUp || newBadges.length) actions.syncSeen(lvl, earnedIds);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
