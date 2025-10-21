import { IContestMetadata } from "./contest.interface";

const resolveCoinId = async (categoryName: string): Promise<string> => {
    const cryptoMap: Record<string, string> = {
        'bitcoin': 'bitcoin',
        'btc': 'bitcoin',
        'ethereum': 'ethereum',
        'eth': 'ethereum',
        'cardano': 'cardano',
        'ada': 'cardano',
        'solana': 'solana',
        'sol': 'solana',
        'ripple': 'ripple',
        'xrp': 'ripple',
        'dogecoin': 'dogecoin',
        'doge': 'dogecoin',
        'polkadot': 'polkadot',
        'dot': 'polkadot',
        'litecoin': 'litecoin',
        'ltc': 'litecoin',
        'chainlink': 'chainlink',
        'link': 'chainlink',
        'avalanche': 'avalanche-2',
        'avax': 'avalanche-2'
    };

    const normalized = categoryName.toLowerCase().trim();
    return cryptoMap[normalized] || 'bitcoin'; // Default to bitcoin if not found
};

const resolveStockSymbol = (categoryName: string): string => {
    const stockMap: Record<string, string> = {
        'apple': 'AAPL',
        'microsoft': 'MSFT',
        'google': 'GOOGL',
        'alphabet': 'GOOGL',
        'amazon': 'AMZN',
        'tesla': 'TSLA',
        'meta': 'META',
        'facebook': 'META',
        'nvidia': 'NVDA',
        'netflix': 'NFLX',
        'disney': 'DIS',
        'walmart': 'WMT',
        'coca-cola': 'KO',
        'pepsi': 'PEP',
        'mcdonalds': 'MCD',
        'visa': 'V',
        'mastercard': 'MA',
        'jpmorgan': 'JPM',
        'bank of america': 'BAC',
        'intel': 'INTC',
        'amd': 'AMD',
        'ibm': 'IBM',
        'oracle': 'ORCL',
        'salesforce': 'CRM'
    };

    const normalized = categoryName.toLowerCase().trim();
    return stockMap[normalized] || 'AAPL'; // Default to Apple if not found
};

const resolvePlayerInfo = (categoryName: string): { playerId?: string, league?: string, statType?: string } => {
    // You can expand this based on your sports categories
    // Format example: "NFL - Patrick Mahomes Passing Yards"
    const nflPlayers: Record<string, string> = {
        'patrick mahomes': '19298',
        'josh allen': '19350',
        'joe burrow': '19371',
        'lamar jackson': '17248',
        'justin herbert': '19373'
    };

    const normalized = categoryName.toLowerCase();
    
    if (normalized.includes('nfl')) {
        return {
            league: 'nfl',
            statType: normalized.includes('passing') ? 'PassingYards' : 
                     normalized.includes('rushing') ? 'RushingYards' : 
                     normalized.includes('receiving') ? 'ReceivingYards' : 'Points'
        };
    } else if (normalized.includes('nba')) {
        return {
            league: 'nba',
            statType: normalized.includes('points') ? 'Points' : 
                     normalized.includes('rebounds') ? 'Rebounds' : 
                     normalized.includes('assists') ? 'Assists' : 'Points'
        };
    } else if (normalized.includes('mlb')) {
        return {
            league: 'mlb',
            statType: normalized.includes('home run') ? 'HomeRuns' : 
                     normalized.includes('rbi') ? 'RunsBattedIn' : 
                     normalized.includes('stolen base') ? 'StolenBases' : 'Hits'
        };
    }

    return {};
};

const resolveEconomicSeries = (categoryName: string): string => {
    const economicMap: Record<string, string> = {
        'cpi': 'CPIAUCSL',
        'inflation': 'CPIAUCSL',
        'consumer price index': 'CPIAUCSL',
        'gdp': 'GDP',
        'unemployment': 'UNRATE',
        'unemployment rate': 'UNRATE',
        'treasury': 'DGS10',
        '10 year treasury': 'DGS10',
        'fed funds rate': 'FEDFUNDS',
        'federal funds rate': 'FEDFUNDS',
        'housing starts': 'HOUST',
        'retail sales': 'RSXFS',
        'industrial production': 'INDPRO'
    };

    const normalized = categoryName.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(economicMap)) {
        if (normalized.includes(key)) {
            return value;
        }
    }
    
    return 'CPIAUCSL';
};

const resolveMovieId = (categoryName: string): string | null => {
    // This would need to be looked up from TMDB API in real implementation
    // For now, return null and handle it manually
    return null;
};


export const generateMetadataFromCategory = async (
    category: any,
    contestName?: string
): Promise<IContestMetadata | undefined> => {
    const categoryGroup = category.group
        .trim()
        .split(' ')[0]  // Take first word
        .toLowerCase();
    
    const categoryName = category.name.trim();

    console.log(`🔍 Generating metadata for group: "${category.group}" -> normalized: "${categoryGroup}"`);

    switch (categoryGroup) {
        case 'crypto':
        case 'cryptocurrency':
            return {
                cryptoId: await resolveCoinId(categoryName),
                dataSource: "CoinGecko",
                resultUnit: "USD"
            };

        case 'stock':
        case 'stocks':
            return {
                stockSymbol: resolveStockSymbol(categoryName),
                dataSource: "Alpha Vantage",
                resultUnit: "USD"
            };

        case 'sports':
        case 'sport':
            const sportInfo = resolvePlayerInfo(contestName || categoryName);
            return {
                ...sportInfo,
                dataSource: "SportsData.io",
                resultUnit: sportInfo.statType === 'Points' ? 'points' : 'yards'
            };

        case 'economic':
        case 'economy':
            return {
                economicSeries: resolveEconomicSeries(categoryName),
                dataSource: "FRED",
                resultUnit: "percentage"
            };

        case 'energy':
        case 'oil':
        case 'commodities':
            return {
                dataSource: "EIA",
                resultUnit: categoryName.toLowerCase().includes('oil') ? "USD per barrel" : "USD"
            };

        case 'entertainment':
        case 'movies':
        case 'social':  // For "Social Media"
            const movieId = resolveMovieId(categoryName);
            if (movieId) {
                return {
                    movieId,
                    metricType: "revenue",
                    dataSource: "TMDB",
                    resultUnit: "USD"
                };
            }
            // For social media or entertainment without specific ID
            return {
                dataSource: categoryGroup === 'social' ? "YouTube" : "TMDB",
                metricType: categoryGroup === 'social' ? "views" : "revenue",
                resultUnit: categoryGroup === 'social' ? "count" : "USD"
            };

        default:
            console.warn(`⚠️ Unknown category group: ${categoryGroup} (original: ${category.group})`);
            return undefined;
    }
};