// localStorage save: cash, respect, mission progress, garage upgrades, race best times.
const KEY = 'puerto-brasa-save-v1';
export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fresh save below */ }
  return null;
}
export function storeSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      cash: state.cash, respect: state.respect, missionIndex: state.missionIndex,
      upgrades: state.upgrades, bestTimes: state.bestTimes, ammo: state.ammo,
    }));
  } catch { /* storage unavailable: play continues unsaved */ }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
