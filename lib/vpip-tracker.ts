export const CURRENT_KEY="poker-read-vpip-current-v3";
export const HISTORY_KEY="poker-read-vpip-history-v3";
export type VpipAction="fold"|"call"|"raise";
export type SavedSession={id:string;date:string;hands:number;folds:number;calls:number;raises:number;vpipHands:number;vpip:number;pfr:number;startAmount:number|null;endAmount:number|null;profit:number;savedAt:string};
export function stats(a:VpipAction[]){const hands=a.length,folds=a.filter(x=>x==="fold").length,calls=a.filter(x=>x==="call").length,raises=a.filter(x=>x==="raise").length,vpipHands=calls+raises;return{hands,folds,calls,raises,vpipHands,vpip:hands?vpipHands/hands*100:0,pfr:hands?raises/hands*100:0}}
export function loadActions():VpipAction[]{try{const x=JSON.parse(localStorage.getItem(CURRENT_KEY)||"[]");return Array.isArray(x)?x.filter((v):v is VpipAction=>v==="fold"||v==="call"||v==="raise"):[]}catch{return[]}}
export function saveActions(a:VpipAction[]){try{localStorage.setItem(CURRENT_KEY,JSON.stringify(a));return true}catch{return false}}
export function clearActions(){try{localStorage.removeItem(CURRENT_KEY);return true}catch{return false}}
export function loadHistory():SavedSession[]{try{const x=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
export function saveHistory(h:SavedSession[]){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h));return true}catch{return false}}
export function totals(h:SavedSession[]){const hands=h.reduce((s,x)=>s+x.hands,0),vp=h.reduce((s,x)=>s+x.vpipHands,0),r=h.reduce((s,x)=>s+x.raises,0),profit=h.reduce((s,x)=>s+x.profit,0);return{sessions:h.length,hands,vpip:hands?vp/hands*100:0,pfr:hands?r/hands*100:0,profit}}
