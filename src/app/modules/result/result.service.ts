import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import config from '../../../config';
import { ContestMetadata } from './result.interface';


/**
 * Service to fetch actual contest results from various data sources
 */



class ContestResultService {
    
    /**
     * Main method to fetch result based on contest metadata
     */
    async fetchContestResult(contest: any): Promise<number | null> {
        const metadata = this.extractMetadata(contest);
        
        switch (metadata.category) {
            case 'crypto':
                return await this.fetchCryptoResult(metadata);
            case 'stock':
                return await this.fetchStockResult(metadata);
            case 'sports':
                return await this.fetchSportsResult(metadata);
            case 'economic':
                return await this.fetchEconomicResult(metadata);
            case 'energy':
                return await this.fetchEnergyResult(metadata);
            case 'entertainment':
                return await this.fetchEntertainmentResult(metadata);
            default:
                throw new AppError(
                    StatusCodes.BAD_REQUEST, 
                    `Unknown contest category: ${metadata.category}`
                );
        }
    }

    
    private extractMetadata(contest: any): ContestMetadata {
        return {
            category: contest.category.toLowerCase(),
            cryptoId: contest.metadata?.cryptoId,
            stockSymbol: contest.metadata?.stockSymbol,
            playerId: contest.metadata?.playerId,
            gameId: contest.metadata?.gameId,
            league: contest.metadata?.league,
            movieId: contest.metadata?.movieId,
            videoId: contest.metadata?.videoId,
            economicSeries: contest.metadata?.economicSeries
        };
    }

    /**
     * Fetch cryptocurrency price
     */
    private async fetchCryptoResult(metadata: ContestMetadata): Promise<number> {
        if (!metadata.cryptoId) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Crypto ID not provided');
        }

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price`,
            {
                params: {
                    ids: metadata.cryptoId,
                    vs_currencies: 'usd'
                }
            }
        );

        const price = response.data[metadata.cryptoId]?.usd;
        
        if (!price) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Crypto price not found');
        }

        return parseFloat(price);
    }

    /**
     * Fetch stock price
     */
    private async fetchStockResult(metadata: ContestMetadata): Promise<number> {
        if (!metadata.stockSymbol) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Stock symbol not provided');
        }

        const response = await axios.get(
            `https://www.alphavantage.co/query`,
            {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: metadata.stockSymbol,
                    apikey: config.api.alphavantage_api_key
                }
            }
        );

        const quote = response.data['Global Quote'];
        
        if (!quote || Object.keys(quote).length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Stock data not found');
        }

        return parseFloat(quote['05. price']);
    }

    /**
     * Fetch sports data (player stats)
     */
    private async fetchSportsResult(metadata: ContestMetadata): Promise<number> {
        if (!metadata.playerId || !metadata.league) {
            throw new AppError(
                StatusCodes.BAD_REQUEST, 
                'Player ID and league are required'
            );
        }

        const season = new Date().getFullYear().toString();
        const leagueEndpoints: Record<string, string> = {
            'nfl': `https://api.sportsdata.io/v3/nfl/stats/json/PlayerSeasonStats/${season}`,
            'nba': `https://api.sportsdata.io/v3/nba/stats/json/PlayerSeasonStats/${season}`,
            'mlb': `https://api.sportsdata.io/v3/mlb/stats/json/PlayerSeasonStats/${season}`
        };

        const endpoint = leagueEndpoints[metadata.league];
        if (!endpoint) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid league');
        }

        const response = await axios.get(endpoint, {
            params: { key: config.api.sportsDataIO }
        });

        const playerStats = response.data.find((p: any) =>
            String(p.PlayerID) === metadata.playerId
        );

        if (!playerStats) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Player stats not found');
        }

        // Return relevant stat based on contest type
        // You'll need to specify which stat to use (points, yards, etc.)
        // This is a placeholder - adjust based on your needs
        return playerStats.Points || playerStats.PassingYards || 0;
    }

    /**
     * Fetch economic indicator data
     */
    private async fetchEconomicResult(metadata: ContestMetadata): Promise<number> {
        if (!metadata.economicSeries) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Economic series not provided');
        }

        const response = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations`,
            {
                params: {
                    series_id: metadata.economicSeries,
                    api_key: config.api.fred_api_key,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 1
                }
            }
        );

        const observations = response.data.observations;
        
        if (!observations || observations.length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Economic data not found');
        }

        const latestValue = observations[0].value;
        
        if (latestValue === '.') {
            throw new AppError(StatusCodes.NOT_FOUND, 'No valid economic data available');
        }

        return parseFloat(latestValue);
    }

    /**
     * Fetch energy/oil price
     */
    private async fetchEnergyResult(metadata: ContestMetadata): Promise<number> {
        const response = await axios.get(
            `https://api.eia.gov/v2/petroleum/pri/spt/data/`,
            {
                params: {
                    api_key: config.api.eia,
                    frequency: 'daily',
                    'data[0]': 'value',
                    'facets[product][]': 'EPCWTI',
                    'sort[0][column]': 'period',
                    'sort[0][direction]': 'desc',
                    length: 1
                }
            }
        );

        const data = response.data.response.data;
        
        if (!data || data.length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Oil price data not found');
        }

        return parseFloat(data[0].value);
    }

    /**
     * Fetch entertainment data (movie/video metrics)
     */
    private async fetchEntertainmentResult(metadata: ContestMetadata): Promise<number> {
        if (metadata.movieId) {
            return await this.fetchMovieRevenue(metadata.movieId);
        } else if (metadata.videoId) {
            return await this.fetchVideoViews(metadata.videoId);
        } else {
            throw new AppError(
                StatusCodes.BAD_REQUEST, 
                'Movie ID or Video ID required'
            );
        }
    }

    private async fetchMovieRevenue(movieId: string): Promise<number> {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}`,
            { params: { api_key: config.api.tmdb } }
        );

        return response.data.revenue || 0;
    }

    private async fetchVideoViews(videoId: string): Promise<number> {
        const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos`,
            {
                params: {
                    part: 'statistics',
                    id: videoId,
                    key: config.api.youtube
                }
            }
        );

        const video = response.data.items?.[0];
        
        if (!video) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Video not found');
        }

        return parseInt(video.statistics.viewCount);
    }
}

export const contestResultService = new ContestResultService();