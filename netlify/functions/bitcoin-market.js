// Public, read-only market data. No API key or visitor credentials required.
exports.handler = async function (event) {
  const periods = { '1': [86400, 3600], '7': [604800, 21600], '30': [2592000, 86400] };
  const days = event.queryStringParameters?.days || '1';
  if (!periods[days]) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid period' }) };
  const [duration, granularity] = periods[days];
  const end = new Date();
  const start = new Date(end.getTime() - duration * 1000);
  const base = 'https://api.exchange.coinbase.com/products/BTC-USD/';
  try {
    const results = await Promise.all(['ticker', `candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`].map(async path => {
      const response = await fetch(base + path, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Market provider unavailable');
      return response.json();
    }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=120' }, body: JSON.stringify({ ticker: results[0], candles: results[1] }) };
  } catch {
    return { statusCode: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: 'Market data temporarily unavailable' }) };
  }
};
