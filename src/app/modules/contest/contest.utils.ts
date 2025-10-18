import axios from 'axios';
import { COMMON, CoinLite, IContest, IPredictionTier, UnifiedForecastResponse } from './contest.interface';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

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


export const normalizeCryptoResponse = (data: any, action: 'current' | 'history'): UnifiedForecastResponse['data'] => {
    if (action === 'current') {
        return {
            category: 'crypto',
            asset: data.asset,
            currentValue: data.price,
            changePercent: data.change24h || 0,
            unit: 'USD',
            timestamp: new Date(data.lastUpdated * 1000).toISOString(),
            metadata: {
                source: 'CoinGecko',
                period: '24h'
            }
        };
    } else {
        return {
            category: 'crypto',
            asset: data.asset,
            currentValue: data.current,
            previousValue: data.start,
            changeAmount: data.end - data.start,
            changePercent: data.changeRate,
            unit: 'USD',
            timestamp: new Date().toISOString(),
            metadata: {
                source: 'CoinGecko',
                period: `${data.prices?.length || 0} data points`
            },
            history: data.prices?.map((p: any) => ({
                timestamp: new Date(p[0]).toISOString(),
                value: p[1]
            }))
        };
    }
};

/**
 * Normalize Stock Response
 */
export const normalizeStockResponse = (data: any, action: 'current' | 'history'): UnifiedForecastResponse['data'] => {
    if (action === 'current') {
        return {
            category: 'stock',
            asset: data.symbol,
            currentValue: data.price,
            changeAmount: data.change,
            changePercent: parseFloat(data.changePercent?.replace('%', '') || '0'),
            unit: 'USD',
            timestamp: new Date(data.lastTradingDay).toISOString(),
            metadata: {
                source: 'Alpha Vantage',
                period: '1 day',
                additionalInfo: {
                    volume: data.volume
                }
            }
        };
    } else {
        const firstPrice = data.prices[data.prices.length - 1]?.close || 0;
        const lastPrice = data.prices[0]?.close || 0;

        return {
            category: 'stock',
            asset: data.symbol,
            currentValue: lastPrice,
            previousValue: firstPrice,
            changeAmount: lastPrice - firstPrice,
            changePercent: data.changeRate,
            unit: 'USD',
            timestamp: new Date().toISOString(),
            metadata: {
                source: 'Alpha Vantage',
                period: `${data.prices?.length || 0} intervals`
            },
            history: data.prices?.map((p: any) => ({
                timestamp: p.timestamp,
                value: p.close,
                open: p.open,
                high: p.high,
                low: p.low,
                volume: p.volume
            }))
        };
    }
};

/**
 * Normalize Economic Response
 */
export const normalizeEconomicResponse = (data: any): UnifiedForecastResponse['data'] => {
    return {
        category: 'economic',
        asset: data.series,
        currentValue: data.latestValue,
        previousValue: data.previousValue,
        changeAmount: data.latestValue - data.previousValue,
        changePercent: data.changeRate,
        unit: 'Index',
        timestamp: new Date(data.latestDate).toISOString(),
        metadata: {
            source: 'FRED',
            period: 'Latest available',
            additionalInfo: {
                dataPoints: data.data?.length || 0
            }
        },
        history: data.data?.map((obs: any) => ({
            timestamp: obs.date,
            value: parseFloat(obs.value)
        }))
    };
};

/**
 * Normalize Oil/Energy Response
 */
export const normalizeEnergyResponse = (data: any): UnifiedForecastResponse['data'] => {
    return {
        category: 'energy',
        asset: data.commodity,
        currentValue: data.currentPrice,
        previousValue: data.previousPrice,
        changeAmount: data.currentPrice - data.previousPrice,
        changePercent: data.changeRate,
        unit: 'USD/barrel',
        timestamp: new Date(data.date).toISOString(),
        metadata: {
            source: 'EIA',
            period: 'Daily',
            additionalInfo: {
                historicalDays: data.history?.length || 0
            }
        },
        history: data.history?.map((h: any) => ({
            timestamp: h.period,
            value: parseFloat(h.value)
        }))
    };
};

/**
 * Normalize Sports Response
 */
export const normalizeSportsResponse = (data: any, type: 'player' | 'game'): UnifiedForecastResponse['data'] => {
    if (type === 'player') {
        const player = data.player;

        // Determine primary stat based on league
        let currentValue = 0;
        let unit = 'points';

        if (data.league === 'NFL') {
            currentValue = player.PassingYards || player.RushingYards || 0;
            unit = 'yards';
        } else if (data.league === 'NBA') {
            currentValue = player.Points || 0;
            unit = 'points';
        } else if (data.league === 'MLB') {
            currentValue = player.HomeRuns || 0;
            unit = 'home runs';
        }

        return {
            category: 'sports',
            asset: player.Name || 'Unknown Player',
            currentValue,
            changePercent: 0,
            unit,
            timestamp: new Date().toISOString(),
            metadata: {
                source: 'SportsDataIO',
                period: `Season ${data.season}`,
                additionalInfo: {
                    league: data.league,
                    team: player.Team,
                    allStats: player
                }
            }
        };
    } else {
        const game = data.game;
        const scoreDifference = Math.abs(game.HomeScore - game.AwayScore);

        return {
            category: 'sports',
            asset: `${game.HomeTeam} vs ${game.AwayTeam}`,
            currentValue: scoreDifference,
            changePercent: 0,
            unit: 'point difference',
            timestamp: new Date().toISOString(),
            metadata: {
                source: 'SportsDataIO',
                period: 'Game',
                additionalInfo: {
                    league: data.league,
                    homeTeam: game.HomeTeam,
                    awayTeam: game.AwayTeam,
                    homeScore: game.HomeScore,
                    awayScore: game.AwayScore,
                    status: game.Status
                }
            }
        };
    }
};

export const normalizeEntertainmentResponse = (data: any, type: 'movie' | 'youtube'): UnifiedForecastResponse['data'] => {
    if (type === 'movie') {
        const profit = data.revenue - data.budget;
        const roi = data.budget > 0 ? (profit / data.budget) * 100 : 0;

        return {
            category: 'entertainment',
            asset: data.title,
            currentValue: data.revenue,
            previousValue: data.budget,
            changeAmount: profit,
            changePercent: roi,
            unit: 'USD',
            timestamp: new Date(data.releaseDate).toISOString(),
            metadata: {
                source: 'TMDB',
                period: 'Total Box Office',
                additionalInfo: {
                    popularity: data.popularity,
                    voteAverage: data.voteAverage
                }
            }
        };
    } else {
        return {
            category: 'entertainment',
            asset: data.title,
            currentValue: data.views,
            changePercent: 0,
            unit: 'views',
            timestamp: new Date(data.publishedAt).toISOString(),
            metadata: {
                source: 'YouTube',
                period: 'Total',
                additionalInfo: {
                    likes: data.likes,
                    comments: data.comments
                }
            }
        };
    }
};

// ============= MASTER NORMALIZER =============
export const normalizeResponse = (
    rawData: any,
    category: string,
    action?: string
): UnifiedForecastResponse['data'] => {
    try {
        switch (category.toLowerCase()) {
            case 'crypto':
                return normalizeCryptoResponse(rawData, action as 'current' | 'history');

            case 'stock':
                return normalizeStockResponse(rawData, action as 'current' | 'history');

            case 'economic':
                return normalizeEconomicResponse(rawData);

            case 'oil':
            case 'energy':
                return normalizeEnergyResponse(rawData);

            case 'sports':
                const sportsType = rawData.player ? 'player' : 'game';
                return normalizeSportsResponse(rawData, sportsType);

            case 'entertainment':
                const entertainmentType = rawData.revenue ? 'movie' : 'youtube';
                return normalizeEntertainmentResponse(rawData, entertainmentType);

            default:
                throw new Error(`Unknown category: ${category}`);
        }
    } catch (error: any) {
        throw new Error(`Normalization failed: ${error.message}`);
    }
};



export const resolveStockSymbol = (symbol: string): string => {
    const validSymbols = ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'TSLA', 'SPY', 'QQQ', 'DIA'];
    const upper = symbol.toUpperCase();
    if (validSymbols.includes(upper)) return upper;
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid stock symbol');
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
export const validateTierCoverage = (contest: IContest): string[] => {
    const warnings: string[] = [];
    const start = contest.predictions.minPrediction;
    const end = contest.predictions.maxPrediction;

    if (contest.pricing.predictionType === 'tier' || contest.pricing.predictionType === 'percentage') {
        const activeTiers = contest.pricing.tiers.filter((t: IPredictionTier) => t.isActive);
        
        if (activeTiers.length === 0) {
            warnings.push('No active tiers found');
            return warnings;
        }

        // Check if tiers cover the full range
        const minTierValue = Math.min(...activeTiers.map(t => t.min));
        const maxTierValue = Math.max(...activeTiers.map(t => t.max));

        if (minTierValue > start) {
            warnings.push(`Gap at start: Predictions from ${start} to ${minTierValue - 1} are not covered by any tier`);
        }
        
        if (maxTierValue < end) {
            warnings.push(`Gap at end: Predictions from ${maxTierValue + 1} to ${end} are not covered by any tier`);
        }

        // Check for gaps between tiers
        const sortedTiers = activeTiers.sort((a, b) => a.min - b.min);
        for (let i = 0; i < sortedTiers.length - 1; i++) {
            const currentTierMax = sortedTiers[i].max;
            const nextTierMin = sortedTiers[i + 1].min;
            
            if (nextTierMin > currentTierMax + 1) {
                warnings.push(`Gap between tiers: ${currentTierMax + 1} to ${nextTierMin - 1} not covered`);
            }
        }
    }

    return warnings;
};