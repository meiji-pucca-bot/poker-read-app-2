"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PokerTerm = {
  term: string;
  english: string;
  category: string;
  meaning: string;
  example: string;
  tip: string;
  importance: number;
};

const pokerTerms: PokerTerm[] = [
  {
    "term": "アクション",
    "english": "Action",
    "category": "基本",
    "meaning": "プレイヤーが選ぶ行動の総称。チェック、ベット、コール、レイズ、フォールドなど。",
    "example": "フロップで相手がチェックし、自分がベットする。",
    "tip": "行動の総称として覚える。",
    "importance": 5
  },
  {
    "term": "アンティ",
    "english": "Ante",
    "category": "基本",
    "meaning": "全員がハンド開始前に少額を出す強制ベット。主にトーナメントで使われる。",
    "example": "BBアンティ方式ではBBが全員分をまとめて支払う。",
    "tip": "ブラインドとは別の強制参加料。",
    "importance": 4
  },
  {
    "term": "オールイン",
    "english": "All-in",
    "category": "基本",
    "meaning": "残りスタックをすべて投入すること。",
    "example": "残り20BBをすべて入れてオールインする。",
    "tip": "最も大きいアクション。",
    "importance": 5
  },
  {
    "term": "ショーダウン",
    "english": "Showdown",
    "category": "基本",
    "meaning": "最後にカードを公開して勝敗を決めること。",
    "example": "リバーでコールされ、両者がカードを見せる。",
    "tip": "公開して比較する場面。",
    "importance": 5
  },
  {
    "term": "ポット",
    "english": "Pot",
    "category": "基本",
    "meaning": "テーブル中央に集まったチップの合計。",
    "example": "ポット1万円に5千円をベットする。",
    "tip": "みんなが争う賞金。",
    "importance": 5
  },
  {
    "term": "スタック",
    "english": "Stack",
    "category": "基本",
    "meaning": "各プレイヤーが持っているチップ量。",
    "example": "開始スタックは100BB。",
    "tip": "手持ちチップ。",
    "importance": 5
  },
  {
    "term": "有効スタック",
    "english": "Effective Stack",
    "category": "基本",
    "meaning": "そのハンドで実際に賭けられる最大額。少ない方のスタックが基準。",
    "example": "Hero100BB、相手40BBなら有効スタックは40BB。",
    "tip": "少ない方で考える。",
    "importance": 5
  },
  {
    "term": "ブラインド",
    "english": "Blind",
    "category": "基本",
    "meaning": "SBとBBが払う強制ベット。",
    "example": "SB100、BB200でゲーム開始。",
    "tip": "参加前に自動で払う。",
    "importance": 5
  },
  {
    "term": "スモールブラインド",
    "english": "Small Blind",
    "category": "ポジション",
    "meaning": "ボタンの左隣。BBの半額程度を強制で払う。",
    "example": "SB100、BB200。",
    "tip": "略称SB。",
    "importance": 5
  },
  {
    "term": "ビッグブラインド",
    "english": "Big Blind",
    "category": "ポジション",
    "meaning": "SBの左隣。基準額となる強制ベットを払う。",
    "example": "BB200なら2.5BBは500。",
    "tip": "略称BB。",
    "importance": 5
  },
  {
    "term": "UTG",
    "english": "Under the Gun",
    "category": "ポジション",
    "meaning": "プリフロップで最初に行動するポジション。",
    "example": "9人卓では最も早い位置から参加判断をする。",
    "tip": "強いハンド中心。",
    "importance": 5
  },
  {
    "term": "MP",
    "english": "Middle Position",
    "category": "ポジション",
    "meaning": "テーブル中央付近のポジション。",
    "example": "UTGより少し広く参加できる。",
    "tip": "中間位置。",
    "importance": 4
  },
  {
    "term": "LJ",
    "english": "Lojack",
    "category": "ポジション",
    "meaning": "COの2つ前のポジション。",
    "example": "9人卓では中盤の位置。",
    "tip": "ロージャック。",
    "importance": 3
  },
  {
    "term": "HJ",
    "english": "Hijack",
    "category": "ポジション",
    "meaning": "COの1つ前のポジション。",
    "example": "後ろが少ないため比較的広く参加できる。",
    "tip": "ハイジャック。",
    "importance": 4
  },
  {
    "term": "CO",
    "english": "Cutoff",
    "category": "ポジション",
    "meaning": "BTNの1つ前。非常に有利な後半ポジション。",
    "example": "弱めのハンドでもオープン候補が増える。",
    "tip": "カットオフ。",
    "importance": 5
  },
  {
    "term": "BTN",
    "english": "Button",
    "category": "ポジション",
    "meaning": "ディーラーボタンの位置。ポストフロップで最後に行動しやすい最有利ポジション。",
    "example": "BTNから広くオープンする。",
    "tip": "最も有利。",
    "importance": 5
  },
  {
    "term": "アーリーポジション",
    "english": "Early Position",
    "category": "ポジション",
    "meaning": "早い順番で行動する位置の総称。",
    "example": "UTGやUTG+1。",
    "tip": "後ろが多いので慎重に。",
    "importance": 4
  },
  {
    "term": "レイトポジション",
    "english": "Late Position",
    "category": "ポジション",
    "meaning": "後ろの順番で行動する位置の総称。",
    "example": "COやBTN。",
    "tip": "情報が多く有利。",
    "importance": 5
  },
  {
    "term": "インポジション",
    "english": "In Position",
    "category": "ポジション",
    "meaning": "相手より後に行動できる状態。",
    "example": "BTN対BBではBTNがインポジション。",
    "tip": "後出しできる。",
    "importance": 5
  },
  {
    "term": "アウトオブポジション",
    "english": "Out of Position",
    "category": "ポジション",
    "meaning": "相手より先に行動する状態。",
    "example": "BB対BTNではBBがアウトオブポジション。",
    "tip": "先に動くので難しい。",
    "importance": 5
  },
  {
    "term": "オープンレイズ",
    "english": "Open Raise",
    "category": "プリフロップ",
    "meaning": "まだ誰も参加していない状況で最初にレイズすること。",
    "example": "COから2.5BBにオープン。",
    "tip": "最初のレイズ。",
    "importance": 5
  },
  {
    "term": "リンプ",
    "english": "Limp",
    "category": "プリフロップ",
    "meaning": "レイズせずBBと同額だけ払って参加すること。",
    "example": "UTGが1BBで参加。",
    "tip": "初心者は多用しすぎ注意。",
    "importance": 5
  },
  {
    "term": "コールドコール",
    "english": "Cold Call",
    "category": "プリフロップ",
    "meaning": "自分がまだチップを入れていない状態で、レイズにコールすること。",
    "example": "COオープンにBTNがコール。",
    "tip": "レイズを受けて参加。",
    "importance": 4
  },
  {
    "term": "3ベット",
    "english": "3-Bet",
    "category": "プリフロップ",
    "meaning": "オープンレイズに対する再レイズ。",
    "example": "COが2.5BB、BTNが8BBに3ベット。",
    "tip": "3回目のベット段階。",
    "importance": 5
  },
  {
    "term": "4ベット",
    "english": "4-Bet",
    "category": "プリフロップ",
    "meaning": "3ベットに対する再レイズ。",
    "example": "BTNの3ベットにCOが4ベット。",
    "tip": "かなり強いレンジになりやすい。",
    "importance": 5
  },
  {
    "term": "5ベット",
    "english": "5-Bet",
    "category": "プリフロップ",
    "meaning": "4ベットに対するさらに再レイズ。",
    "example": "100BBではオールインになることも多い。",
    "tip": "超強いアクション。",
    "importance": 3
  },
  {
    "term": "スクイーズ",
    "english": "Squeeze",
    "category": "プリフロップ",
    "meaning": "オープンとコールが入った後に大きく3ベットすること。",
    "example": "COオープン、BTNコール、SBがスクイーズ。",
    "tip": "複数人をまとめて圧力。",
    "importance": 4
  },
  {
    "term": "アイソレートレイズ",
    "english": "Isolation Raise",
    "category": "プリフロップ",
    "meaning": "リンプした相手と1対1になりやすくするためのレイズ。",
    "example": "UTGリンプにBTNが5BBへレイズ。",
    "tip": "弱い相手を孤立させる。",
    "importance": 4
  },
  {
    "term": "スチール",
    "english": "Steal",
    "category": "プリフロップ",
    "meaning": "主にCO・BTN・SBからブラインド獲得を狙うレイズ。",
    "example": "BTNから広く2.2BBオープン。",
    "tip": "ブラインドを狙う。",
    "importance": 5
  },
  {
    "term": "ブラインドディフェンス",
    "english": "Blind Defense",
    "category": "プリフロップ",
    "meaning": "SBやBBがレイトポジションのオープンに対抗すること。",
    "example": "BBがBTNオープンにコール。",
    "tip": "降りすぎない守り。",
    "importance": 5
  },
  {
    "term": "レンジ",
    "english": "Range",
    "category": "戦略",
    "meaning": "相手が持ち得るハンド候補全体。",
    "example": "BTNオープンには広いレンジが含まれる。",
    "tip": "1つのハンドではなく集合。",
    "importance": 5
  },
  {
    "term": "オープンレンジ",
    "english": "Opening Range",
    "category": "戦略",
    "meaning": "各ポジションから最初にレイズするハンド範囲。",
    "example": "UTGは狭く、BTNは広い。",
    "tip": "位置ごとに変わる。",
    "importance": 5
  },
  {
    "term": "コールレンジ",
    "english": "Calling Range",
    "category": "戦略",
    "meaning": "相手のベットやレイズにコールするハンド範囲。",
    "example": "BBはBTNオープンに広くコール。",
    "tip": "続行する候補。",
    "importance": 5
  },
  {
    "term": "3ベットレンジ",
    "english": "3-Bet Range",
    "category": "戦略",
    "meaning": "3ベットに使うハンド範囲。",
    "example": "AAなどのバリューとA5sなどのブラフ。",
    "tip": "強い手＋一部ブラフ。",
    "importance": 5
  },
  {
    "term": "ポラライズ",
    "english": "Polarized",
    "category": "戦略",
    "meaning": "非常に強いハンドとブラフに分かれたレンジ。",
    "example": "リバーの大きなベットはポラライズされやすい。",
    "tip": "強いか弱いか。",
    "importance": 4
  },
  {
    "term": "マージ",
    "english": "Merged Range",
    "category": "戦略",
    "meaning": "中程度以上の強さを連続的に含むレンジ。",
    "example": "相手が広くコールするならマージ気味にベット。",
    "tip": "強さが連続する。",
    "importance": 3
  },
  {
    "term": "ナッツ",
    "english": "Nuts",
    "category": "ハンド",
    "meaning": "その場面で作れる最強ハンド。",
    "example": "Aハイフラッシュがナッツ。",
    "tip": "絶対最強。",
    "importance": 5
  },
  {
    "term": "セカンドナッツ",
    "english": "Second Nuts",
    "category": "ハンド",
    "meaning": "その場面で2番目に強いハンド。",
    "example": "Kハイフラッシュがセカンドナッツ。",
    "tip": "最強の一つ下。",
    "importance": 4
  },
  {
    "term": "トップペア",
    "english": "Top Pair",
    "category": "ハンド",
    "meaning": "ボードで最も高いランクと自分のカードがペアになった状態。",
    "example": "K-8-3でKQを持つ。",
    "tip": "一番上のペア。",
    "importance": 5
  },
  {
    "term": "ミドルペア",
    "english": "Middle Pair",
    "category": "ハンド",
    "meaning": "フロップの中央ランクとペアになった状態。",
    "example": "K-8-3でA8を持つ。",
    "tip": "真ん中のペア。",
    "importance": 4
  },
  {
    "term": "ボトムペア",
    "english": "Bottom Pair",
    "category": "ハンド",
    "meaning": "フロップの最も低いランクとペアになった状態。",
    "example": "K-8-3でA3を持つ。",
    "tip": "下のペア。",
    "importance": 4
  },
  {
    "term": "オーバーペア",
    "english": "Overpair",
    "category": "ハンド",
    "meaning": "自分のポケットペアがボードの最高カードより高い状態。",
    "example": "9-6-2でJJを持つ。",
    "tip": "ボードより上のペア。",
    "importance": 5
  },
  {
    "term": "ツーペア",
    "english": "Two Pair",
    "category": "ハンド",
    "meaning": "異なる2組のペア。",
    "example": "AKを持ち、A-K-4のボード。",
    "tip": "2つのペア。",
    "importance": 5
  },
  {
    "term": "セット",
    "english": "Set",
    "category": "ハンド",
    "meaning": "ポケットペアから作るスリーカード。",
    "example": "77を持ち、K-7-2。",
    "tip": "見えにくい強い役。",
    "importance": 5
  },
  {
    "term": "トリップス",
    "english": "Trips",
    "category": "ハンド",
    "meaning": "ボードのペアと自分の1枚で作るスリーカード。",
    "example": "A7を持ち、7-7-K。",
    "tip": "ボードペア型の三つ組。",
    "importance": 4
  },
  {
    "term": "ストレート",
    "english": "Straight",
    "category": "ハンド",
    "meaning": "連続する5枚のランク。",
    "example": "5-6-7-8-9。",
    "tip": "5枚連続。",
    "importance": 5
  },
  {
    "term": "フラッシュ",
    "english": "Flush",
    "category": "ハンド",
    "meaning": "同じスート5枚。",
    "example": "ハートが5枚揃う。",
    "tip": "同じマーク5枚。",
    "importance": 5
  },
  {
    "term": "フルハウス",
    "english": "Full House",
    "category": "ハンド",
    "meaning": "スリーカードとワンペアの組み合わせ。",
    "example": "777KK。",
    "tip": "3枚＋2枚。",
    "importance": 5
  },
  {
    "term": "フォーカード",
    "english": "Four of a Kind",
    "category": "ハンド",
    "meaning": "同じランク4枚。",
    "example": "AAAA。",
    "tip": "4枚同じ。",
    "importance": 4
  },
  {
    "term": "ストレートフラッシュ",
    "english": "Straight Flush",
    "category": "ハンド",
    "meaning": "同じスートで連続する5枚。",
    "example": "5♥6♥7♥8♥9♥。",
    "tip": "非常に強い役。",
    "importance": 3
  },
  {
    "term": "ロイヤルフラッシュ",
    "english": "Royal Flush",
    "category": "ハンド",
    "meaning": "同じスートのT-J-Q-K-A。",
    "example": "A♠K♠Q♠J♠T♠。",
    "tip": "最強役。",
    "importance": 3
  },
  {
    "term": "キッカー",
    "english": "Kicker",
    "category": "ハンド",
    "meaning": "同じ役同士の勝敗を決める補助カード。",
    "example": "A9とA7がAペアなら9キッカーが勝つ。",
    "tip": "同じ役の差。",
    "importance": 5
  },
  {
    "term": "バックドアドロー",
    "english": "Backdoor Draw",
    "category": "ドロー",
    "meaning": "ターンとリバーの両方で必要カードが落ちれば完成するドロー。",
    "example": "フロップでハート3枚目が必要な状態。",
    "tip": "2枚連続で必要。",
    "importance": 4
  },
  {
    "term": "フラッシュドロー",
    "english": "Flush Draw",
    "category": "ドロー",
    "meaning": "あと1枚同じスートが来ればフラッシュになる状態。",
    "example": "ハート4枚が見えている。",
    "tip": "9アウトが目安。",
    "importance": 5
  },
  {
    "term": "オープンエンドストレートドロー",
    "english": "Open-Ended Straight Draw",
    "category": "ドロー",
    "meaning": "両端どちらでもストレートになるドロー。",
    "example": "6-7-8-9で5かTが必要。",
    "tip": "8アウトが目安。",
    "importance": 5
  },
  {
    "term": "ガットショット",
    "english": "Gutshot",
    "category": "ドロー",
    "meaning": "内側1ランクだけでストレートになるドロー。",
    "example": "5-6-8-9で7が必要。",
    "tip": "4アウトが目安。",
    "importance": 5
  },
  {
    "term": "コンボドロー",
    "english": "Combo Draw",
    "category": "ドロー",
    "meaning": "複数の強いドローを同時に持つ状態。",
    "example": "フラッシュドロー＋ストレートドロー。",
    "tip": "勝率が高いドロー。",
    "importance": 5
  },
  {
    "term": "オーバーカード",
    "english": "Overcard",
    "category": "ドロー",
    "meaning": "ボードの最高カードより高いホールカード。",
    "example": "9-6-2でAQを持つ。",
    "tip": "当たれば上のペア。",
    "importance": 4
  },
  {
    "term": "アウト",
    "english": "Outs",
    "category": "ドロー",
    "meaning": "自分のハンドを改善すると考えられる残りカード。",
    "example": "フラッシュドローなら通常9アウト。",
    "tip": "改善カードの枚数。",
    "importance": 5
  },
  {
    "term": "エクイティ",
    "english": "Equity",
    "category": "戦略",
    "meaning": "ポットを獲得できる期待割合。簡単には現在の勝率。",
    "example": "勝率60%ならエクイティ約60%。",
    "tip": "自分の取り分。",
    "importance": 5
  },
  {
    "term": "フォールドエクイティ",
    "english": "Fold Equity",
    "category": "戦略",
    "meaning": "相手をフォールドさせることで得られる利益。",
    "example": "ドローでレイズし、降ろせる可能性も利用。",
    "tip": "降ろす力。",
    "importance": 5
  },
  {
    "term": "ポットオッズ",
    "english": "Pot Odds",
    "category": "戦略",
    "meaning": "コール額と獲得可能なポットの比率。",
    "example": "ポット100に50コールなら必要勝率25%。",
    "tip": "コール判断の基準。",
    "importance": 5
  },
  {
    "term": "インプライドオッズ",
    "english": "Implied Odds",
    "category": "戦略",
    "meaning": "ドロー完成後に追加で取れるチップも含めた期待。",
    "example": "小さくコールして完成後に大きく取る。",
    "tip": "将来の利益込み。",
    "importance": 4
  },
  {
    "term": "リバースインプライドオッズ",
    "english": "Reverse Implied Odds",
    "category": "戦略",
    "meaning": "完成しても上位ハンドに負けて追加損失が出る危険。",
    "example": "低いフラッシュが高いフラッシュに負ける。",
    "tip": "完成しても危険。",
    "importance": 3
  },
  {
    "term": "必要勝率",
    "english": "Required Equity",
    "category": "戦略",
    "meaning": "コールが損益分岐になるために必要な勝率。",
    "example": "ポット100に50コールなら25%。",
    "tip": "足りるか比較。",
    "importance": 5
  },
  {
    "term": "EV",
    "english": "Expected Value",
    "category": "GTO・分析",
    "meaning": "期待値。長期的に平均してどれだけ得するか。",
    "example": "+EVのコールは長期的に利益。",
    "tip": "結果より期待値。",
    "importance": 5
  },
  {
    "term": "GTO",
    "english": "Game Theory Optimal",
    "category": "GTO・分析",
    "meaning": "相手に簡単に攻略されにくい理論上の戦略。",
    "example": "バリューとブラフを適切に混ぜる。",
    "tip": "基準となる戦略。",
    "importance": 5
  },
  {
    "term": "エクスプロイト",
    "english": "Exploit",
    "category": "GTO・分析",
    "meaning": "相手の癖や弱点に合わせて戦略を調整すること。",
    "example": "降りすぎる相手にブラフを増やす。",
    "tip": "相手に合わせる。",
    "importance": 5
  },
  {
    "term": "MDF",
    "english": "Minimum Defense Frequency",
    "category": "GTO・分析",
    "meaning": "相手のブラフを自動利益にさせない最低防御頻度。",
    "example": "ポットベットには理論上50%程度守る。",
    "tip": "降りすぎ防止の目安。",
    "importance": 3
  },
  {
    "term": "コンボ",
    "english": "Combo",
    "category": "GTO・分析",
    "meaning": "特定ハンドの組み合わせ数。",
    "example": "AKsは4コンボ、AKoは12コンボ。",
    "tip": "組み合わせの数。",
    "importance": 4
  },
  {
    "term": "ブロッカー",
    "english": "Blocker",
    "category": "GTO・分析",
    "meaning": "自分のカードが相手の特定ハンド候補を減らすこと。",
    "example": "A♠を持つとナッツフラッシュ候補が減る。",
    "tip": "相手の候補を消す。",
    "importance": 5
  },
  {
    "term": "アンブロッカー",
    "english": "Unblocker",
    "category": "GTO・分析",
    "meaning": "相手のブラフ候補を減らしていないカード。",
    "example": "相手のミスドローをブロックしない。",
    "tip": "ブラフキャッチで重要。",
    "importance": 3
  },
  {
    "term": "レンジアドバンテージ",
    "english": "Range Advantage",
    "category": "GTO・分析",
    "meaning": "一方のレンジ全体が相手より強い状態。",
    "example": "A-K-2ではプリフロップレイザーが有利。",
    "tip": "全体の強さの差。",
    "importance": 5
  },
  {
    "term": "ナッツアドバンテージ",
    "english": "Nut Advantage",
    "category": "GTO・分析",
    "meaning": "最強級ハンドを多く持つ側が有利な状態。",
    "example": "低いコネクトボードでBB側がセットを多く持つ。",
    "tip": "強い役の偏り。",
    "importance": 4
  },
  {
    "term": "Cベット",
    "english": "Continuation Bet",
    "category": "フロップ以降",
    "meaning": "プリフロップレイザーがフロップでも続けてベットすること。",
    "example": "BTNオープン、BBコール、BTNがフロップベット。",
    "tip": "続けて打つ。",
    "importance": 5
  },
  {
    "term": "ディレイドCベット",
    "english": "Delayed C-Bet",
    "category": "フロップ以降",
    "meaning": "フロップをチェックし、ターンで初めてベットすること。",
    "example": "フロップチェックバック後、ターンでベット。",
    "tip": "1ストリート遅らせる。",
    "importance": 4
  },
  {
    "term": "ダブルバレル",
    "english": "Double Barrel",
    "category": "フロップ以降",
    "meaning": "フロップとターンで連続ベットすること。",
    "example": "Cベット後、ターンでも再度ベット。",
    "tip": "2発目。",
    "importance": 4
  },
  {
    "term": "トリプルバレル",
    "english": "Triple Barrel",
    "category": "フロップ以降",
    "meaning": "フロップ・ターン・リバーすべてでベットすること。",
    "example": "3ストリート連続で圧力をかける。",
    "tip": "3発撃つ。",
    "importance": 4
  },
  {
    "term": "チェックレイズ",
    "english": "Check-Raise",
    "category": "ベット・アクション",
    "meaning": "最初にチェックし、相手のベット後にレイズすること。",
    "example": "BBチェック、BTNベット、BBレイズ。",
    "tip": "チェックから反撃。",
    "importance": 5
  },
  {
    "term": "チェックバック",
    "english": "Check Back",
    "category": "ベット・アクション",
    "meaning": "相手のチェック後、自分もチェックして次へ進むこと。",
    "example": "BBチェック、BTNもチェック。",
    "tip": "無料で次を見る。",
    "importance": 5
  },
  {
    "term": "ドンクベット",
    "english": "Donk Bet",
    "category": "ベット・アクション",
    "meaning": "前ストリートの攻撃者より先にベットすること。",
    "example": "BBがBTNのCベットを待たずフロップ先打ち。",
    "tip": "先制ベット。",
    "importance": 4
  },
  {
    "term": "プローブベット",
    "english": "Probe Bet",
    "category": "ベット・アクション",
    "meaning": "相手が前ストリートでベットしなかった後、次ストリートで先に打つこと。",
    "example": "フロップチェックバック後、BBがターンベット。",
    "tip": "弱さを探る。",
    "importance": 4
  },
  {
    "term": "オーバーベット",
    "english": "Overbet",
    "category": "ベット・アクション",
    "meaning": "ポットより大きいベット。",
    "example": "ポット100に150ベット。",
    "tip": "100%超。",
    "importance": 5
  },
  {
    "term": "ブロックベット",
    "english": "Block Bet",
    "category": "ベット・アクション",
    "meaning": "相手の大きなベットを防ぎやすくする小さなベット。",
    "example": "リバーで25%ポットを先打ち。",
    "tip": "安くショーダウン狙い。",
    "importance": 4
  },
  {
    "term": "バリューベット",
    "english": "Value Bet",
    "category": "ベット・アクション",
    "meaning": "自分より弱いハンドからコールをもらうためのベット。",
    "example": "トップペアで下のペアから取る。",
    "tip": "弱い手に払ってもらう。",
    "importance": 5
  },
  {
    "term": "シンバリュー",
    "english": "Thin Value",
    "category": "ベット・アクション",
    "meaning": "わずかに弱いハンドからコールを狙う薄いバリューベット。",
    "example": "リバーでセカンドペアを小さくベット。",
    "tip": "ギリギリの価値取り。",
    "importance": 4
  },
  {
    "term": "ブラフ",
    "english": "Bluff",
    "category": "ベット・アクション",
    "meaning": "弱いハンドで相手をフォールドさせるためのベットやレイズ。",
    "example": "ミスドローでリバーを大きくベット。",
    "tip": "弱い手で降ろす。",
    "importance": 5
  },
  {
    "term": "セミブラフ",
    "english": "Semi-Bluff",
    "category": "ベット・アクション",
    "meaning": "現状は弱いが改善可能性のあるハンドで攻めること。",
    "example": "フラッシュドローでレイズ。",
    "tip": "降ろす＋引いて勝つ。",
    "importance": 5
  },
  {
    "term": "ブラフキャッチャー",
    "english": "Bluff Catcher",
    "category": "ハンド",
    "meaning": "相手のバリューには負けるがブラフには勝てるハンド。",
    "example": "リバーで弱いトップペアを持つ。",
    "tip": "ブラフだけに勝つ。",
    "importance": 5
  },
  {
    "term": "スロープレイ",
    "english": "Slow Play",
    "category": "戦略",
    "meaning": "強いハンドであえて弱く見せるプレイ。",
    "example": "セットでフロップチェック。",
    "tip": "強さを隠す。",
    "importance": 4
  },
  {
    "term": "トラップ",
    "english": "Trap",
    "category": "戦略",
    "meaning": "相手のベットを誘うために強いハンドで受け身に打つこと。",
    "example": "AAでチェックしてブラフを誘う。",
    "tip": "罠を張る。",
    "importance": 4
  },
  {
    "term": "ポットコントロール",
    "english": "Pot Control",
    "category": "戦略",
    "meaning": "中程度のハンドでポットを大きくしすぎない考え方。",
    "example": "トップペアでターンチェック。",
    "tip": "大きくしすぎない。",
    "importance": 5
  },
  {
    "term": "プロテクション",
    "english": "Protection",
    "category": "戦略",
    "meaning": "相手に安く改善させないためにベットすること。",
    "example": "弱いドローが多い場面でベット。",
    "tip": "無料カードを与えない。",
    "importance": 5
  },
  {
    "term": "エア",
    "english": "Air",
    "category": "ハンド",
    "meaning": "ほとんどショーダウンバリューがない弱いハンド。",
    "example": "ハイカードだけでドローもない。",
    "tip": "何もない手。",
    "importance": 4
  },
  {
    "term": "ショーダウンバリュー",
    "english": "Showdown Value",
    "category": "戦略",
    "meaning": "ベットせずカードを見せても勝つ可能性がある強さ。",
    "example": "セカンドペアでチェックバック。",
    "tip": "見せて勝てる力。",
    "importance": 5
  },
  {
    "term": "ドライボード",
    "english": "Dry Board",
    "category": "ボード",
    "meaning": "ドローが少なく役が変化しにくいボード。",
    "example": "A-7-2レインボー。",
    "tip": "静かなボード。",
    "importance": 5
  },
  {
    "term": "ウェットボード",
    "english": "Wet Board",
    "category": "ボード",
    "meaning": "ストレートやフラッシュドローが多いボード。",
    "example": "J-T-9ツートーン。",
    "tip": "変化が多いボード。",
    "importance": 5
  },
  {
    "term": "レインボー",
    "english": "Rainbow",
    "category": "ボード",
    "meaning": "フロップ3枚のスートがすべて異なる状態。",
    "example": "A♠7♥2♣。",
    "tip": "フラッシュドローなし。",
    "importance": 5
  },
  {
    "term": "モノトーン",
    "english": "Monotone",
    "category": "ボード",
    "meaning": "フロップ3枚がすべて同じスート。",
    "example": "A♥8♥3♥。",
    "tip": "フラッシュ完成可能。",
    "importance": 5
  },
  {
    "term": "ツートーン",
    "english": "Two-Tone",
    "category": "ボード",
    "meaning": "フロップに同じスートが2枚ある状態。",
    "example": "K♠9♠4♦。",
    "tip": "フラッシュドローあり。",
    "importance": 5
  },
  {
    "term": "ペアボード",
    "english": "Paired Board",
    "category": "ボード",
    "meaning": "ボード上に同じランクが2枚以上ある状態。",
    "example": "K-7-7。",
    "tip": "フルハウス注意。",
    "importance": 5
  },
  {
    "term": "コネクトボード",
    "english": "Connected Board",
    "category": "ボード",
    "meaning": "ランクが近くストレートができやすいボード。",
    "example": "9-8-7。",
    "tip": "ストレート注意。",
    "importance": 5
  },
  {
    "term": "ランアウト",
    "english": "Runout",
    "category": "ボード",
    "meaning": "ターンとリバーを含む残りのボード展開。",
    "example": "ターンA、リバーKのランアウト。",
    "tip": "その後のカード。",
    "importance": 4
  },
  {
    "term": "スケアカード",
    "english": "Scare Card",
    "category": "ボード",
    "meaning": "相手のレンジを強く見せたり、現在のハンドを不安にさせるカード。",
    "example": "フラッシュ完成の3枚目スート。",
    "tip": "怖い変化。",
    "importance": 5
  },
  {
    "term": "ブランク",
    "english": "Blank",
    "category": "ボード",
    "meaning": "状況をほとんど変えないカード。",
    "example": "A-7-2にターン3オフスート。",
    "tip": "影響が少ない。",
    "importance": 4
  },
  {
    "term": "SPR",
    "english": "Stack-to-Pot Ratio",
    "category": "戦略",
    "meaning": "残り有効スタックをポットで割った数値。",
    "example": "残り100、ポット50ならSPR2。",
    "tip": "スタックとポットの比。",
    "importance": 4
  },
  {
    "term": "ヘッズアップ",
    "english": "Heads-Up",
    "category": "基本",
    "meaning": "2人だけで争っている状態。",
    "example": "HeroとVillainの1対1。",
    "tip": "2人対戦。",
    "importance": 5
  },
  {
    "term": "マルチウェイ",
    "english": "Multiway",
    "category": "基本",
    "meaning": "3人以上でポットを争っている状態。",
    "example": "フロップを3人で見る。",
    "tip": "複数人対戦。",
    "importance": 5
  },
  {
    "term": "レーキ",
    "english": "Rake",
    "category": "キャッシュゲーム",
    "meaning": "運営側がポットから徴収する手数料。",
    "example": "ポットの数%が差し引かれる。",
    "tip": "場代。",
    "importance": 4
  },
  {
    "term": "バイイン",
    "english": "Buy-in",
    "category": "基本",
    "meaning": "ゲーム参加時に購入するチップ額。",
    "example": "100BBでバイイン。",
    "tip": "参加資金。",
    "importance": 5
  },
  {
    "term": "リバイ",
    "english": "Rebuy",
    "category": "トーナメント",
    "meaning": "敗退後または規定条件で再参加すること。",
    "example": "リバイ期間中に再エントリー。",
    "tip": "もう一度参加。",
    "importance": 3
  },
  {
    "term": "アドオン",
    "english": "Add-on",
    "category": "トーナメント",
    "meaning": "特定タイミングで追加チップを購入すること。",
    "example": "休憩時にアドオン。",
    "tip": "追加購入。",
    "importance": 3
  },
  {
    "term": "バブル",
    "english": "Bubble",
    "category": "トーナメント",
    "meaning": "あと1人敗退すれば入賞という局面。",
    "example": "10位から賞金で残り11人。",
    "tip": "入賞直前。",
    "importance": 4
  },
  {
    "term": "ITM",
    "english": "In The Money",
    "category": "トーナメント",
    "meaning": "賞金圏内に入ること。",
    "example": "20位まで賞金で18位終了。",
    "tip": "入賞。",
    "importance": 4
  },
  {
    "term": "ファイナルテーブル",
    "english": "Final Table",
    "category": "トーナメント",
    "meaning": "トーナメント最後の1卓。",
    "example": "残り9人でFT進出。",
    "tip": "最終卓。",
    "importance": 4
  },
  {
    "term": "ICM",
    "english": "Independent Chip Model",
    "category": "トーナメント",
    "meaning": "トーナメントチップを賞金価値に換算する考え方。",
    "example": "バブルやFTで判断が変わる。",
    "tip": "チップ価値は一定でない。",
    "importance": 4
  },
  {
    "term": "ショートスタック",
    "english": "Short Stack",
    "category": "基本",
    "meaning": "残りスタックが少ない状態。",
    "example": "15BB以下など。",
    "tip": "浅いスタック。",
    "importance": 5
  },
  {
    "term": "ディープスタック",
    "english": "Deep Stack",
    "category": "基本",
    "meaning": "残りスタックが多い状態。",
    "example": "200BB持ち。",
    "tip": "深いスタック。",
    "importance": 4
  },
  {
    "term": "フリーズアウト",
    "english": "Freezeout",
    "category": "トーナメント",
    "meaning": "一度敗退すると再参加できない形式。",
    "example": "リバイなしの大会。",
    "tip": "一発勝負。",
    "importance": 3
  },
  {
    "term": "サテライト",
    "english": "Satellite",
    "category": "トーナメント",
    "meaning": "上位大会の参加権を獲得する予選。",
    "example": "メインイベント出場権を争う。",
    "tip": "予選大会。",
    "importance": 3
  },
  {
    "term": "タイト",
    "english": "Tight",
    "category": "プレイヤータイプ",
    "meaning": "参加ハンドが少ないプレイスタイル。",
    "example": "強いハンド中心に参加。",
    "tip": "慎重。",
    "importance": 5
  },
  {
    "term": "ルース",
    "english": "Loose",
    "category": "プレイヤータイプ",
    "meaning": "参加ハンドが多いプレイスタイル。",
    "example": "幅広いハンドで参加。",
    "tip": "参加が広い。",
    "importance": 5
  },
  {
    "term": "アグレッシブ",
    "english": "Aggressive",
    "category": "プレイヤータイプ",
    "meaning": "ベットやレイズが多いスタイル。",
    "example": "コールよりレイズを選ぶ。",
    "tip": "攻撃的。",
    "importance": 5
  },
  {
    "term": "パッシブ",
    "english": "Passive",
    "category": "プレイヤータイプ",
    "meaning": "コールやチェックが多くレイズが少ないスタイル。",
    "example": "強い手でもコール中心。",
    "tip": "受け身。",
    "importance": 5
  },
  {
    "term": "TAG",
    "english": "Tight Aggressive",
    "category": "プレイヤータイプ",
    "meaning": "参加は厳選し、参加後は積極的に攻めるスタイル。",
    "example": "初心者にも推奨されやすい。",
    "tip": "堅く攻める。",
    "importance": 5
  },
  {
    "term": "LAG",
    "english": "Loose Aggressive",
    "category": "プレイヤータイプ",
    "meaning": "多く参加し、積極的に攻めるスタイル。",
    "example": "高い技術が必要。",
    "tip": "広く攻める。",
    "importance": 4
  },
  {
    "term": "ニット",
    "english": "Nit",
    "category": "プレイヤータイプ",
    "meaning": "極端にタイトで強いハンドしか参加しない人。",
    "example": "レイズ時はかなり強い可能性。",
    "tip": "超慎重。",
    "importance": 4
  },
  {
    "term": "マニアック",
    "english": "Maniac",
    "category": "プレイヤータイプ",
    "meaning": "非常にルースかつ過度に攻撃的な人。",
    "example": "頻繁に大きくレイズ。",
    "tip": "暴走型。",
    "importance": 3
  },
  {
    "term": "テル",
    "english": "Tell",
    "category": "戦略",
    "meaning": "相手の強弱を示す癖や情報。",
    "example": "ベット速度やチップの扱い。",
    "tip": "動作のヒント。",
    "importance": 4
  },
  {
    "term": "タイムバンク",
    "english": "Time Bank",
    "category": "基本",
    "meaning": "考えるために追加で使える時間。",
    "example": "難しいリバー判断で使用。",
    "tip": "追加思考時間。",
    "importance": 3
  },
  {
    "term": "スナップコール",
    "english": "Snap Call",
    "category": "ベット・アクション",
    "meaning": "ほとんど考えず即座にコールすること。",
    "example": "ナッツで瞬時にコール。",
    "tip": "即コール。",
    "importance": 3
  },
  {
    "term": "ヒーローコール",
    "english": "Hero Call",
    "category": "ベット・アクション",
    "meaning": "弱めのハンドで相手のブラフを読んでコールすること。",
    "example": "リバーでAハイコール。",
    "tip": "勇気あるブラフキャッチ。",
    "importance": 4
  },
  {
    "term": "ヒーローフォールド",
    "english": "Hero Fold",
    "category": "ベット・アクション",
    "meaning": "非常に強いハンドを相手のさらに強いレンジを読んで降りること。",
    "example": "セットを大きなリバーレイズにフォールド。",
    "tip": "強い手を降りる。",
    "importance": 4
  }
];

const categories = [
  "すべて",
  ...Array.from(new Set(pokerTerms.map((item) => item.category))),
];

function Stars({ count }: { count: number }) {
  return (
    <span className="tracking-wide text-amber-300">
      {"★".repeat(count)}
      <span className="text-white/15">
        {"☆".repeat(5 - count)}
      </span>
    </span>
  );
}

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("すべて");
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [importantOnly, setImportantOnly] = useState(false);

  const filteredTerms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return pokerTerms
      .filter((item) => {
        const matchesCategory =
          category === "すべて" || item.category === category;

        const matchesImportance =
          !importantOnly || item.importance >= 5;

        const matchesSearch =
          !keyword ||
          item.term.toLowerCase().includes(keyword) ||
          item.english.toLowerCase().includes(keyword) ||
          item.meaning.toLowerCase().includes(keyword) ||
          item.example.toLowerCase().includes(keyword);

        return (
          matchesCategory &&
          matchesImportance &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }

        return a.term.localeCompare(b.term, "ja");
      });
  }, [category, importantOnly, search]);

  return (
    <main className="min-h-screen bg-[#07150f] px-4 pb-7 pt-[max(56px,calc(env(safe-area-inset-top)+20px))] text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <Link
            href="/"
            className="relative z-20 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-emerald-300 active:bg-white/10"
          >
            ← ホームへ戻る
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-400/40 bg-red-500 text-4xl shadow-xl shadow-red-950/40">
              ♥
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.2em] text-red-300">
                POKER DICTIONARY
              </p>

              <h1 className="mt-1 text-3xl font-black">
                ポーカー用語辞典
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-white/60">
            日本語・英語の両方から検索できます。
            用語をタップすると、意味・実戦例・覚え方を確認できます。
          </p>
        </header>

        <section className="rounded-3xl border border-emerald-800/60 bg-gradient-to-br from-emerald-950 to-slate-950 p-5 shadow-xl">
          <label
            htmlFor="dictionary-search"
            className="text-sm font-black text-emerald-300"
          >
            🔍 用語を検索
          </label>

          <input
            id="dictionary-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="例：3ベット、range、ポットオッズ"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-base outline-none placeholder:text-white/25 focus:border-emerald-400"
          />

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/20 p-3">
            <div>
              <p className="text-xs text-white/40">
                検索結果
              </p>

              <p className="mt-1 text-xl font-black text-emerald-300">
                {filteredTerms.length}語
              </p>
            </div>

            <button
              type="button"
              onClick={() => setImportantOnly(!importantOnly)}
              className={`rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-95 ${
                importantOnly
                  ? "border-amber-300 bg-amber-300 text-slate-950"
                  : "border-amber-800 bg-amber-950/30 text-amber-300"
              }`}
            >
              ★重要語だけ
            </button>
          </div>
        </section>

        <section className="mt-4 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition active:scale-95 ${
                  category === item
                    ? "border-emerald-300 bg-emerald-400 text-slate-950"
                    : "border-white/10 bg-white/5 text-white/60"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {filteredTerms.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-lg font-black">
              該当する用語がありません
            </p>

            <p className="mt-2 text-sm text-white/50">
              検索語やカテゴリーを変更してください。
            </p>
          </section>
        ) : (
          <section className="mt-3 space-y-3">
            {filteredTerms.map((item) => {
              const open = openTerm === item.term;

              return (
                <article
                  key={`${item.term}-${item.english}`}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#07150f] shadow-lg shadow-black/20"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTerm(open ? null : item.term)
                    }
                    className="w-full p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-800 bg-emerald-950/40 px-3 py-1 text-[11px] font-black text-emerald-300">
                            {item.category}
                          </span>

                          {item.importance >= 5 && (
                            <span className="rounded-full border border-amber-700 bg-amber-950/40 px-3 py-1 text-[11px] font-black text-amber-300">
                              重要
                            </span>
                          )}
                        </div>

                        <h2 className="mt-3 text-2xl font-black">
                          {item.term}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-white/40">
                          {item.english}
                        </p>

                        <p className="mt-3 text-sm leading-7 text-white/70">
                          {item.meaning}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <Stars count={item.importance} />

                        <p className="mt-3 text-xs font-black text-emerald-300">
                          {open ? "閉じる ▲" : "詳しく見る ▼"}
                        </p>
                      </div>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-white/10 p-5">
                      <section className="rounded-2xl border border-sky-900 bg-sky-950/25 p-4">
                        <p className="text-xs font-black text-sky-300">
                          実戦例
                        </p>

                        <p className="mt-2 text-sm leading-7 text-white/80">
                          {item.example}
                        </p>
                      </section>

                      <section className="rounded-2xl border border-amber-900 bg-amber-950/25 p-4">
                        <p className="text-xs font-black text-amber-300">
                          初心者向けの覚え方
                        </p>

                        <p className="mt-2 text-sm leading-7 text-white/80">
                          {item.tip}
                        </p>
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-red-900/70 bg-red-950/25 p-5">
          <p className="text-xs font-black tracking-[0.18em] text-red-300">
            STUDY TIP
          </p>

          <h2 className="mt-2 text-lg font-black">
            一度に全部覚えなくて大丈夫
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/60">
            まずは重要度★★★★★の用語から覚えましょう。
            AIレビューで分からない用語が出たときに辞典へ戻る使い方がおすすめです。
          </p>
        </section>
      </div>

      
    </main>
  );
}
