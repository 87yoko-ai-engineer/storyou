// lib/text.ts
// テキストの正規化と「近さ」の計算（採点で使う小さな部品）。

/** 0〜100 の整数を英単語に（"80" → "eighty"）。範囲外はそのまま返す。 */
function numberToWords(n: number): string {
  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 0 || n > 100) return String(n);
  if (n < 20) return ones[n];
  if (n === 100) return "one hundred";
  const t = tens[Math.floor(n / 10)];
  const o = n % 10;
  return o === 0 ? t : `${t} ${ones[o]}`;
}

/** 比較しやすいように整える：小文字化・数字を英単語へ・記号除去・空白整理。 */
export function normalize(text: string): string {
  let s = text.toLowerCase();
  // 数字（0〜100）を英単語へ寄せる（"80%" の "80" → "eighty"）
  s = s.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));
  // 記号を空白に
  s = s.replace(/[^a-z0-9\s]/g, " ");
  // 連続空白を1つにまとめて前後を削る
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** 正規化して単語の配列にする。 */
function tokens(text: string): string[] {
  const n = normalize(text);
  return n.length ? n.split(" ") : [];
}

/** 単語レベルの編集距離（Levenshtein）。 */
function levenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** 2つの文の近さを 0〜100 で返す（単語レベルの一致率）。 */
export function similarityScore(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 && tb.length === 0) return 100;
  const maxLen = Math.max(ta.length, tb.length);
  if (maxLen === 0) return 0;
  const sim = 1 - levenshtein(ta, tb) / maxLen;
  return Math.round(Math.max(0, sim) * 100);
}
