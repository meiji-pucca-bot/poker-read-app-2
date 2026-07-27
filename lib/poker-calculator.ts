export type Suit = "s" | "h" | "d" | "c";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";
export type Card = `${Rank}${Suit}`;

export const SUITS: Suit[] = ["s", "h", "d", "c"];
export const RANKS: Rank[] = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

export const ALL_CARDS: Card[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => `${rank}${suit}` as Card),
);

export const SUIT_SYMBOL: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

export const SUIT_LABEL: Record<Suit, string> = {
  s: "スペード",
  h: "ハート",
  d: "ダイヤ",
  c: "クラブ",
};

export function cardLabel(card: Card): string {
  return `${card[0]}${SUIT_SYMBOL[card[1] as Suit]}`;
}

const rankValue: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

type HandScore = [number, number, number, number, number, number];

function scoreFive(cards: Card[]): HandScore {
  const values = cards.map((c) => rankValue[c[0] as Rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c[1]);
  const flush = suits.every((s) => s === suits[0]);

  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) =>
    b[1] - a[1] || b[0] - a[0],
  );

  const unique = [...new Set(values)];
  if (unique.includes(14)) unique.push(1);
  let straightHigh = 0;
  for (let i = 0; i <= unique.length - 5; i += 1) {
    const slice = unique.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) {
      straightHigh = slice[0];
      break;
    }
  }

  if (flush && straightHigh) return [8, straightHigh, 0, 0, 0, 0];
  if (groups[0][1] === 4) {
    const kicker = groups.find((g) => g[1] === 1)?.[0] ?? 0;
    return [7, groups[0][0], kicker, 0, 0, 0];
  }
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    return [6, groups[0][0], groups[1][0], 0, 0, 0];
  }
  if (flush) return [5, values[0], values[1], values[2], values[3], values[4]];
  if (straightHigh) return [4, straightHigh, 0, 0, 0, 0];
  if (groups[0][1] === 3) {
    const kickers = groups.filter((g) => g[1] === 1).map((g) => g[0]).sort((a, b) => b - a);
    return [3, groups[0][0], kickers[0] ?? 0, kickers[1] ?? 0, 0, 0];
  }
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups.find((g) => g[1] === 1)?.[0] ?? 0;
    return [2, highPair, lowPair, kicker, 0, 0];
  }
  if (groups[0][1] === 2) {
    const kickers = groups.filter((g) => g[1] === 1).map((g) => g[0]).sort((a, b) => b - a);
    return [1, groups[0][0], kickers[0] ?? 0, kickers[1] ?? 0, kickers[2] ?? 0, 0];
  }
  return [0, values[0], values[1], values[2], values[3], values[4]];
}

function compareScores(a: HandScore, b: HandScore): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export function bestScore(cards: Card[]): HandScore {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error("役判定には5〜7枚のカードが必要です。");
  }
  let best: HandScore | null = null;
  for (let a = 0; a < cards.length - 4; a += 1)
    for (let b = a + 1; b < cards.length - 3; b += 1)
      for (let c = b + 1; c < cards.length - 2; c += 1)
        for (let d = c + 1; d < cards.length - 1; d += 1)
          for (let e = d + 1; e < cards.length; e += 1) {
            const score = scoreFive([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || compareScores(score, best) > 0) best = score;
          }
  if (!best) throw new Error("役を判定できませんでした。");
  return best;
}

export function handName(cards: Card[]): string {
  const names = [
    "ハイカード", "ワンペア", "ツーペア", "スリーカード",
    "ストレート", "フラッシュ", "フルハウス", "フォーカード",
    "ストレートフラッシュ",
  ];
  return names[bestScore(cards)[0]] ?? "不明";
}

export type EquityResult = {
  wins: number;
  losses: number;
  ties: number;
  equity: number;
  opponentEquity: number;
  tieRate: number;
  trials: number;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function calculateEquity(
  hero: Card[],
  villain: Card[],
  board: Card[],
  trials = 10000,
): EquityResult {
  const known = [...hero, ...villain, ...board];
  if (hero.length !== 2) throw new Error("Heroのカードを2枚選んでください。");
  if (villain.length !== 0 && villain.length !== 2) {
    throw new Error("相手のカードは2枚、または未指定にしてください。");
  }
  if (![0, 3, 4, 5].includes(board.length)) {
    throw new Error("ボードは0枚・3枚・4枚・5枚で入力してください。");
  }
  if (new Set(known).size !== known.length) {
    throw new Error("同じカードが重複しています。");
  }

  const deck = ALL_CARDS.filter((card) => !known.includes(card));
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (let i = 0; i < trials; i += 1) {
    const sample = shuffle(deck);
    let offset = 0;
    const villainCards =
      villain.length === 2 ? villain : [sample[offset++], sample[offset++]];
    const neededBoard = 5 - board.length;
    const runout = sample.slice(offset, offset + neededBoard);
    const fullBoard = [...board, ...runout];

    const heroScore = bestScore([...hero, ...fullBoard]);
    const villainScore = bestScore([...villainCards, ...fullBoard]);
    const cmp = compareScores(heroScore, villainScore);
    if (cmp > 0) wins += 1;
    else if (cmp < 0) losses += 1;
    else ties += 1;
  }

  return {
    wins,
    losses,
    ties,
    equity: ((wins + ties / 2) / trials) * 100,
    opponentEquity: ((losses + ties / 2) / trials) * 100,
    tieRate: (ties / trials) * 100,
    trials,
  };
}

export function potOdds(pot: number, bet: number, call: number): {
  finalPot: number;
  requiredEquity: number;
} {
  const finalPot = pot + bet + call;
  return {
    finalPot,
    requiredEquity: finalPot > 0 ? (call / finalPot) * 100 : 0,
  };
}

export function drawOdds(outs: number, cardsToCome: 1 | 2): number {
  const safeOuts = Math.max(0, Math.min(47, Math.floor(outs)));
  if (cardsToCome === 1) return (safeOuts / 47) * 100;
  return (1 - ((47 - safeOuts) / 47) * ((46 - safeOuts) / 46)) * 100;
}
