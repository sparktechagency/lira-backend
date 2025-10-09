import axios from 'axios';
import { COMMON, CoinLite } from './contest.interface';
import config from '../../../config';

export const getStockPrice = async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${config.api.alphavantage_api_key}`;
    try {
        const response = await axios.get(url);
        const timeSeries = response.data["Time Series (Daily)"];
        const latestDate = Object.keys(timeSeries)[0];
        return timeSeries[latestDate]["4. close"];
    } catch (error) {
        console.error(error);
    }
};







//================================================================
// Load CoinGecko coin index, cached for 6 hours
const loadCoinIndex = async (): Promise<CoinLite[]> => {
    let COIN_INDEX: CoinLite[] | null = null;
    let LAST_INDEX_AT = 0;
    const INDEX_TTL_MS = 6 * 60 * 60 * 1000;

    const now = Date.now();
    if (COIN_INDEX && now - LAST_INDEX_AT < INDEX_TTL_MS) return COIN_INDEX;
    const { data } = await axios.get<CoinLite[]>(
        'https://api.coingecko.com/api/v3/coins/list?include_platform=false'
    );
    COIN_INDEX = data;
    LAST_INDEX_AT = now;
    return COIN_INDEX!;
}

const normalize = (s: string): string => {
    return s.trim().toLowerCase();
}

// choose best among multiple same symbols by highest market cap
const pickByMarketCap = async (ids: string[]): Promise<string> => {
    if (ids.length === 1) return ids[0];
    const url =
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' +
        ids.join(',');
    const { data } = await axios.get<any[]>(url);
    if (!data?.length) return ids[0];
    data.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
    return data[0].id;
}

// final fallback using search API
const searchFallback = async (q: string): Promise<string | null> => {
    const { data } = await axios.get<{ coins: any[] }>(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`
    );
    if (!data?.coins?.length) return null;
    return data.coins[0].id || null;
}

export const resolveCoinId = async (input: string): Promise<string> => {
    const q = normalize(input);

    // fast common map
    if (COMMON[q]) return COMMON[q];

    const list = await loadCoinIndex();

    // exact id match
    const idHit = list.find(c => c.id === q);
    if (idHit) return idHit.id;

    // exact name match
    const nameHit = list.find(c => normalize(c.name) === q);
    if (nameHit) return nameHit.id;

    // symbol match, may be multiple ids
    const symbolMatches = list.filter(c => c.symbol === q);
    if (symbolMatches.length) {
        const ids = symbolMatches.map(c => c.id);
        return await pickByMarketCap(ids);
    }

    // partial name match
    const partial = list.filter(c => normalize(c.name).includes(q)).slice(0, 5);
    if (partial.length === 1) return partial[0].id;
    if (partial.length > 1) {
        const ids = partial.map(c => c.id);
        return await pickByMarketCap(ids);
    }

    // fallback to /search
    const s = await searchFallback(q);
    if (s) return s;

    throw new Error('Unknown crypto identifier');
}
