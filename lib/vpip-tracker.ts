export const VPIP_STORAGE_KEY = "poker-read-vpip-tracker-v1";

export type VpipAction = "fold" | "call" | "raise";

export type VpipSession = {
  actions: VpipAction[];
  updatedAt: string;
};

export function loadVpipSession(): VpipSession {
  try {
    const raw = window.localStorage.getItem(VPIP_STORAGE_KEY);

    if (!raw) {
      return { actions: [], updatedAt: new Date().toISOString() };
    }

    const parsed = JSON.parse(raw) as Partial<VpipSession>;
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.filter(
          (action): action is VpipAction =>
            action === "fold" || action === "call" || action === "raise",
        )
      : [];

    return {
      actions,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return { actions: [], updatedAt: new Date().toISOString() };
  }
}

export function saveVpipSession(actions: VpipAction[]): boolean {
  try {
    const data: VpipSession = {
      actions,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(VPIP_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("VPIPデータの保存に失敗しました。", error);
    return false;
  }
}

export function clearVpipSession(): boolean {
  try {
    window.localStorage.removeItem(VPIP_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("VPIPデータの削除に失敗しました。", error);
    return false;
  }
}

export function calculateVpipStats(actions: VpipAction[]) {
  const hands = actions.length;
  const folds = actions.filter((action) => action === "fold").length;
  const calls = actions.filter((action) => action === "call").length;
  const raises = actions.filter((action) => action === "raise").length;
  const vpipHands = calls + raises;

  return {
    hands,
    folds,
    calls,
    raises,
    vpipHands,
    vpip: hands > 0 ? (vpipHands / hands) * 100 : 0,
    pfr: hands > 0 ? (raises / hands) * 100 : 0,
  };
}
