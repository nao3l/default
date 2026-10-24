// 合言葉の照合。文字列比較の所要時間から合言葉を推測されないよう、全体を比較する
export async function isAuthorized(request: Request, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const header = request.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(given)),
    crypto.subtle.digest('SHA-256', encoder.encode(token)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
