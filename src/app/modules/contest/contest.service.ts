import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest, IGeneratedPrediction, IPredictionTier, US_STATES } from "./contest.interface";
import { Contest } from "./contest.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Category } from "../category/category.model";
import { User } from "../user/user.model";
import { USER_ROLES } from "../../../enums/user";
import { normalizeResponse, resolveCoinId, resolveStockSymbol, validateTierCoverage } from "./contest.utils";
import axios from "axios";
import config from "../../../config";
import { generateMetadataFromCategory } from "./contest.helpers";
import { Types } from "mongoose";

const createContest = async (payload: Partial<IContest>) => {
    // Validate required fields
    if (!payload.name || !payload.categoryId || !payload.description) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Name, categoryId, and description are required');
    }
    // Validate predictions fields
    if (!payload.predictions?.minPrediction || !payload.predictions?.maxPrediction || !payload.predictions?.increment) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Prediction min, max, and increment are required');
    }
    // Validate time
    if (payload.startTime && payload.endTime && new Date(payload.endTime) <= new Date(payload.startTime)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'End time must be after start time');
    }
    if (payload.categoryId) {
        const category = await Category.findById(payload.categoryId);
        if (!category) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Category not found');
        }
        category.count += 1;
        await category.save();
        payload.categoryId = category._id;
        payload.category = category.name;
        payload.group = category.group;
        payload.groupId = category.groupId ? new Types.ObjectId(String(category.groupId)) : undefined;
        const generatedMetadata = await generateMetadataFromCategory(category, payload.name);
        console.log(generatedMetadata, "this is generatedMetadata meta data");
        if (generatedMetadata) {
            payload.metadata = generatedMetadata;
        }
    }
    if (payload.pricing?.tiers) {
        payload.pricing.minTierPrice = Math.min(...payload.pricing.tiers.map(t => t.min))
        payload.pricing.maxTierPrice = Math.max(...payload.pricing.tiers.map(t => t.max))

    }

    const result = await Contest.create(payload);

    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest creation failed');
    }
    
    return result;
};
const getAllContests = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(Contest.find().populate('categoryId', 'name url group'), query)

    const result = await queryBuilder.filter()
        .sort()
        .paginate()
        .fields()
        .search(['name', 'description'])
        .modelQuery.exec()

    const meta = await queryBuilder.countTotal()

    return {
        meta,
        result
    }
};
const getContestById = async (id: string) => {

    const result = await Contest.findById(id).populate('categoryId');
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
};
const updateContest = async (id: string, payload: Partial<IContest>) => {


    const existingContest = await Contest.findById(id);
    if (!existingContest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Check if critical fields are being updated
    const criticalFieldsUpdated =
        payload.predictions?.minPrediction !== undefined ||
        payload.predictions?.maxPrediction !== undefined ||
        payload.predictions?.increment !== undefined ||
        payload.predictions?.numberOfEntriesPerPrediction !== undefined ||
        payload.pricing?.tiers !== undefined;

    if (criticalFieldsUpdated) {
        // Don't allow updating critical fields if contest is active and has entries
        if (existingContest.status === 'Active' && existingContest.totalEntries > 0) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                'Cannot update prediction structure of active contest with existing entries'
            );
        }
    }


    const result = await Contest.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    }).populate('categoryId');

    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest update failed');
    }

    return result;
};
const deleteContest = async (id: string) => {
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    if (contest.categoryId) {
        const category = await Category.findById(contest.categoryId);
        if (category) {
            category.count -= 1;
            await category.save();
        }
    }

    // Don't allow deleting if contest has entries
    if (contest.totalEntries > 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot delete contest with existing entries');
    }

    const result = await Contest.findByIdAndUpdate(id, { status: 'Deleted' }, {
        new: true,
        runValidators: true
    });
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest update failed');
    }
    return result;
};
// const publishContest = async (id: string) => {
//     const contest = await Contest.findById(id);
//     if (!contest) {
//         throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
//     }

//     // Calculate how many predictions will be generated
//     const start = contest.predictions.minPrediction;
//     const end = contest.predictions.maxPrediction;
//     const increment = contest.predictions.increment;
//     const totalPredictions = Math.floor((end - start) / increment) + 1;

//     // Set a reasonable limit (adjust as needed)
//     const MAX_PREDICTIONS = 50000;
//     if (totalPredictions > MAX_PREDICTIONS) {
//         throw new AppError(
//             StatusCodes.BAD_REQUEST,
//             `Too many predictions to generate (${totalPredictions}). Maximum allowed is ${MAX_PREDICTIONS}. Please increase increment or reduce range.`
//         );
//     }
//     const coverageWarnings = validateTierCoverage(contest);
//     if (coverageWarnings.length > 0) {
//         coverageWarnings.forEach(w => console.warn(`   - ${w}`));
//     }
//     // Generate predictions if not already generated
//     if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
//         try {
//             const generatedPredictions: IGeneratedPrediction[] = [];

//             // Generate predictions in batches for better performance
//             const BATCH_SIZE = 1000;
//             let currentBatch = 0;
//             let generatedCount = 0;

//             for (let value = start; value <= end; value += increment) {
//                 let prediction: IGeneratedPrediction | null = null;

//                 switch (contest.pricing.predictionType) {
//                     case 'priceOnly':
//                         prediction = {
//                             value,
//                             tierId: 'flat_price',
//                             price: contest.pricing.flatPrice,
//                             currentEntries: 0,
//                             maxEntries: contest.predictions.numberOfEntriesPerPrediction,
//                             isAvailable: true
//                         };
//                         break;

//                     case 'percentage':
//                         const percentageTier = contest.pricing.tiers.find((t: IPredictionTier) =>
//                             t.isActive && value >= t.min && value <= t.max
//                         );

//                         if (percentageTier) {
//                             prediction = {
//                                 value,
//                                 tierId: percentageTier.id || `percentage_tier_${percentageTier.name.replace(/\s/g, '_')}`,
//                                 price: percentageTier.pricePerPrediction,
//                                 currentEntries: 0,
//                                 maxEntries: contest.predictions.numberOfEntriesPerPrediction,
//                                 isAvailable: true
//                             };
//                         }
//                         break;

//                     case 'tier':
//                         const tier = contest.pricing.tiers.find((t: IPredictionTier) =>
//                             t.isActive && value >= t.min && value <= t.max
//                         );

//                         if (tier) {
//                             prediction = {
//                                 value,
//                                 tierId: tier.id || `tier_${tier.name.replace(/\s/g, '_')}`,
//                                 price: tier.pricePerPrediction,
//                                 currentEntries: 0,
//                                 maxEntries: contest.predictions.numberOfEntriesPerPrediction,
//                                 isAvailable: true
//                             };
//                         }
//                         break;

//                     default:
//                         throw new AppError(
//                             StatusCodes.BAD_REQUEST,
//                             `Invalid prediction type: ${contest.pricing.predictionType}`
//                         );
//                 }

//                 if (prediction) {
//                     generatedPredictions.push(prediction);
//                     generatedCount++;

//                     // Log progress for large batches
//                     if (generatedCount % BATCH_SIZE === 0) {
//                         currentBatch++;
//                     }
//                 }
//             }

//             // Validate that at least some predictions were generated
//             if (generatedPredictions.length === 0) {
//                 throw new AppError(
//                     StatusCodes.BAD_REQUEST,
//                     'Cannot publish contest: No predictions could be generated. Possible reasons:\n' +
//                     '- No active tiers match the prediction range\n' +
//                     '- Tier min/max values do not cover the prediction range\n' +
//                     `- Prediction range: ${start} to ${end}\n` +
//                     `- Check your tier configurations`
//                 );
//             }

//             // Check coverage - warn if some predictions couldn't be generated
//             const expectedPredictions = totalPredictions;
//             const actualPredictions = generatedPredictions.length;

//             if (actualPredictions < expectedPredictions) {
//                 const coverage = ((actualPredictions / expectedPredictions) * 100).toFixed(2);
//             }

//             // Assign generated predictions
//             contest.predictions.generatedPredictions = generatedPredictions;

//         } catch (error: any) {
//             throw new AppError(
//                 StatusCodes.INTERNAL_SERVER_ERROR,
//                 `Failed to generate predictions: ${error instanceof Error ? error.message : 'Unknown error'}`
//             );
//         }
//     }
//     // Final validation before publishing
//     if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
//         throw new AppError(
//             StatusCodes.BAD_REQUEST,
//             'Cannot publish contest: No predictions available after generation attempt.'
//         );
//     }
//     // Toggle contest status
//     if (contest.status === 'Active') {
//         contest.status = 'Draft';
//     } else {
//         contest.status = 'Active';
//     }

//     // Save with all generated predictions
//     const result = await contest.save();
//     const users = await User.find({});

//     const data = {}



//     return result;
// };



const publishContest = async (id: string) => {
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // ✅ CRITICAL: Check your contest data
    console.log('🔍 DEBUGGING CONTEST DATA:');
    console.log('Prediction Type:', contest.pricing.predictionType);
    console.log('Prediction Range:', {
        min: contest.predictions.minPrediction,
        max: contest.predictions.maxPrediction,
        increment: contest.predictions.increment
    });
    console.log('All Tiers:', JSON.stringify(contest.pricing.tiers.map(t => ({
        name: t.name,
        min: t.min,
        max: t.max,
        isActive: t.isActive,
        price: t.pricePerPrediction
    })), null, 2));

    const start = contest.predictions.minPrediction;
    const end = contest.predictions.maxPrediction;
    const increment = contest.predictions.increment;

    const totalPredictions = Math.floor((end - start) / increment) + 1;

    const MAX_PREDICTIONS = 50000;
    if (totalPredictions > MAX_PREDICTIONS) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Too many predictions to generate (${totalPredictions}). Maximum allowed is ${MAX_PREDICTIONS}.`
        );
    }

    const coverageWarnings = validateTierCoverage(contest);
    if (coverageWarnings.length > 0) {
        console.warn('⚠️ Coverage Warnings:');
        coverageWarnings.forEach(w => console.warn(`   - ${w}`));
    }

    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        try {
            const generatedPredictions: IGeneratedPrediction[] = [];
            const skippedPredictions: { value: number, reason: string }[] = [];

            console.log(`\n🚀 Starting prediction generation...`);
            console.log(`Type: ${contest.pricing.predictionType}`);
            console.log(`Range: ${start} to ${end}, increment: ${increment}`);

            for (let value = start; value <= end; value += increment) {
                let prediction: IGeneratedPrediction | null = null;

                switch (contest.pricing.predictionType) {
                    case 'priceOnly':
                        prediction = {
                            value,
                            tierId: 'flat_price',
                            price: contest.pricing.flatPrice,
                            currentEntries: 0,
                            maxEntries: contest.predictions.numberOfEntriesPerPrediction,
                            isAvailable: true
                        };
                        break;

                    case 'percentage':
                    case 'tier':
                        // ✅ এখানে বিস্তারিত debugging
                        const matchingTier = contest.pricing.tiers.find((t: IPredictionTier) => {
                            const matches = t.isActive && value >= t.min && value <= t.max;

                            // Log first few checks
                            if (value <= start + (increment * 5)) {
                                console.log(`Checking value ${value} against tier "${t.name}":`, {
                                    isActive: t.isActive,
                                    tierMin: t.min,
                                    tierMax: t.max,
                                    valueInRange: value >= t.min && value <= t.max,
                                    matches
                                });
                            }

                            return matches;
                        });

                        if (matchingTier) {
                            prediction = {
                                value,
                                tierId: matchingTier.id || `tier_${matchingTier.name.replace(/\s/g, '_')}`,
                                price: matchingTier.pricePerPrediction,
                                currentEntries: 0,
                                maxEntries: contest.predictions.numberOfEntriesPerPrediction,
                                isAvailable: true
                            };
                        } else {
                            // Track why it was skipped
                            const activeTiers = contest.pricing.tiers.filter(t => t.isActive);
                            if (activeTiers.length === 0) {
                                skippedPredictions.push({ value, reason: 'No active tiers' });
                            } else {
                                skippedPredictions.push({
                                    value,
                                    reason: `No tier covers ${value}. Active ranges: ${activeTiers.map(t => `${t.min}-${t.max}`).join(', ')}`
                                });
                            }
                        }
                        break;

                    default:
                        throw new AppError(
                            StatusCodes.BAD_REQUEST,
                            `Invalid prediction type: ${contest.pricing.predictionType}`
                        );
                }

                if (prediction) {
                    generatedPredictions.push(prediction);
                }
            }

            console.log(`\n📊 Generation Results:`);
            console.log(`✅ Generated: ${generatedPredictions.length}`);
            console.log(`❌ Skipped: ${skippedPredictions.length}`);

            if (skippedPredictions.length > 0) {
                console.log(`\n⚠️ First 10 skipped predictions:`);
                skippedPredictions.slice(0, 10).forEach(s => {
                    console.log(`  Value ${s.value}: ${s.reason}`);
                });
            }

            if (generatedPredictions.length === 0) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    'Cannot publish contest: No predictions could be generated.\n' +
                    `Prediction range: ${start} to ${end} (increment: ${increment})\n` +
                    `Prediction type: ${contest.pricing.predictionType}\n` +
                    `Active tiers: ${contest.pricing.tiers.filter(t => t.isActive).length}\n` +
                    `Tier ranges: ${contest.pricing.tiers.filter(t => t.isActive).map(t => `${t.name}: ${t.min}-${t.max}`).join(', ')}\n\n` +
                    'Possible issues:\n' +
                    '- Tier ranges do not cover prediction range\n' +
                    '- All tiers are inactive\n' +
                    '- Tier min/max values are incorrect'
                );
            }

            contest.predictions.generatedPredictions = generatedPredictions;

        } catch (error: any) {
            console.error('❌ Error:', error.message);
            throw error; // Re-throw to see the detailed error message
        }
    }

    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Cannot publish contest: No predictions available.'
        );
    }

    // Toggle status
    if (contest.status === 'Active') {
        contest.status = 'Draft';
    } else {
        contest.status = 'Active';
    }

    const result = await contest.save();

    console.log(`✅ Contest published with ${result.predictions.generatedPredictions.length} predictions`);

    return result;
};
const generateContestPredictions = async (id: string) => {

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        await contest.generatePredictions();
    }

    const result = await contest.generatePredictions();
    return result;
};
const getActiveContests = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(
        Contest.find({
            status: 'Active'
        }),
        query
    );

    const notAllowedFields = "-predictions.generatedPredictions -results -predictions.placePercentages -predictions.numberOfEntriesPerPrediction -predictions.unit -predictions.increment -createdBy -createdAt -updatedAt -maxEntries -startTime -status -description -categoryId -serial";

    const result = await queryBuilder
        .priceRange()
        .fields()
        .filter()
        .search(["name", "category", "group"])
        .prizeTypeFilter()
        .sort()
        .entryPriceRange()
        .modelQuery
        .select(notAllowedFields)
        .lean()
        .exec();



    const meta = await queryBuilder.countTotal();
    // Get min and max prediction values from all active contests
    const predictionRange = await Contest.aggregate([
        { $match: { status: 'Active' } },
        { $unwind: { path: "$pricing.tiers", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                minPrize: { $min: "$prize.prizePool" },
                maxPrize: { $max: "$prize.prizePool" },
                minPrediction: { $min: "$pricing.tiers.pricePerPrediction" },
                maxPrediction: { $max: "$pricing.tiers.pricePerPrediction" }
            }
        }
    ]);

    // Extract the range values (will be empty object if no contests found)
    const range = predictionRange.length > 0
        ? {
            minPrize: predictionRange[0].minPrize,
            maxPrize: predictionRange[0].maxPrize,
            minPrediction: predictionRange[0].minPrediction,
            maxPrediction: predictionRange[0].maxPrediction
        }
        : {
            minPrize: null,
            maxPrize: null,
            minPrediction: null,
            maxPrediction: null
        };
    const data = {
        range,
        result
    }
    return {
        data,
        meta
    };
};
const shuffleContestSerial = async (contestOrder: Array<{ _id: string; serial: number }>) => {
    if (!contestOrder || !Array.isArray(contestOrder) || contestOrder.length === 0) {
        return;
    }
    const updatePromises = contestOrder.map((item) => Contest.findByIdAndUpdate(item._id, { serial: item.serial }, { new: true }));

    const result = await Promise.all(updatePromises);
    return result;
};

const getTiersContest = async (id: string) => {
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    const result = contest?.pricing;

    return result;
}
// const getPredictionTiers = async (contestId: string, tierId: string) => {
//     const result = await Contest.findById(contestId);
//     if (!result) {
//         throw new AppError(StatusCodes.NOT_FOUND, 'Prediction not found');
//     }
//     if (result?.pricing?.predictionType === 'priceOnly') {
//         const tier = result.predictions.generatedPredictions;
//         if (!tier || tier.length === 0) {
//             throw new AppError(StatusCodes.NOT_FOUND, 'Tier not found');
//         }
//         return tier;
//     }
//     const tier = result.predictions.generatedPredictions.filter((tier) => tier.tierId === tierId);
//     if (!tier || tier.length === 0) {
//         throw new AppError(StatusCodes.NOT_FOUND, 'Tier not found');
//     }
//     return tier;
// }
const getPredictionTiers = async (
    contestId: string,
    tierId: string,
    minValue?: number,
    maxValue?: number,
    searchValue?: number
) => {
    const result = await Contest.findById(contestId);
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Prediction not found');
    }

    let tier;

    if (result?.pricing?.predictionType === 'priceOnly') {
        tier = result.predictions.generatedPredictions;
        if (!tier || tier.length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Tier not found');
        }
    } else {
        tier = result.predictions.generatedPredictions.filter((t) => t.tierId === tierId);
        if (!tier || tier.length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Tier not found');
        }
    }

    // Apply filters
    let filteredTier = tier;

    // Search by specific value
    if (searchValue !== undefined) {
        filteredTier = filteredTier.filter((t) => t.value === searchValue);
    }

    // Range filter (min and max)
    if (minValue !== undefined) {
        filteredTier = filteredTier.filter((t) => t.value >= minValue);
    }
    if (maxValue !== undefined) {
        filteredTier = filteredTier.filter((t) => t.value <= maxValue);
    }

    return filteredTier;
}
const getContestByIdUser = async (id: string, userId: string) => {
    // Run queries in parallel for better performance
    const [isExistUser, result] = await Promise.all([
        User.findById(userId).select('state role').lean(),
        Contest.findById(id).select('name description category predictions categoryId entryFee endTime state image prize totalEntries').lean()
    ]);

    // Check user exists
    if (!isExistUser) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Check contest exists
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Implement state-based access control
    if (isExistUser.role === USER_ROLES.SUPER_ADMIN) {
        return result;
    }
    const minValue = result?.predictions?.generatedPredictions?.[0]?.value;
    const maxValue = result?.predictions?.generatedPredictions?.[result.predictions.generatedPredictions.length - 1]?.value;
    // if (!result.state.includes(isExistUser.state as US_STATES)) {
    //     throw new AppError(
    //         StatusCodes.FORBIDDEN,
    //         'This contest is not available in your state'
    //     );
    // }
    const getCategory = await Category.findById(result.categoryId);
    const data = {
        ...result,
        minValue,
        maxValue,
        group: getCategory?.group
    }
    return data;
}

const getContestByCategoryId = async (id: string) => {
    const result = await Contest.find({ categoryId: id }).sort("serial").select("name category createdBy createdAt updatedAt maxEntries endTime status categoryId serial");
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
}

const getCryptoNews = async () => {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=BTCUSD,SOLUSD,ETHUSD&apikey=${config.api.alphavantage_api_key}`;
    const response = await axios.get(url);

    if (response.data && response.data.feed && response.data.feed.length > 0) {
        return response.data.feed;
    } else {
        console.log("No news found");
        return [];
    }
};
const getCryptoPriceHistory = async (query: Record<string, unknown>) => {
    const rawCrypto = String(query.crypto || 'bitcoin');
    const days = Number(query.days || 1);

    const cryptoId = await resolveCoinId(rawCrypto);
    if (!cryptoId) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Crypto not found');
    }
    const [priceRes, historyRes] = await Promise.all([
        axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`),
        axios.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`),
    ]);

    const currentPrice = (priceRes.data as Record<string, any>)[cryptoId as string]?.usd;
    const prices = historyRes.data.prices; // [timestamp, price]

    if (!prices?.length) {
        throw new AppError(StatusCodes.NOT_FOUND, 'No price history found');
    }

    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    const changeRate = ((lastPrice - firstPrice) / firstPrice) * 100;

    const rawData = {
        cryptoId,
        current: currentPrice,
        start: firstPrice,
        end: lastPrice,
        changeRate: parseFloat(changeRate.toFixed(2)),
        prices,
        source: 'CoinGecko'
    };
    return normalizeResponse(rawData, 'crypto', 'history');
}
const getStockCurrentPrice = async (query: Record<string, unknown>) => {
    const symbol = String(query.symbol || 'AAPL').toUpperCase();

    const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.api.alphavantage_api_key}`
    );

    const quote = response.data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Stock not found or API limit reached');
    }

    const rawData = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        lastTradingDay: quote['07. latest trading day'],
    };

    // 🔥 NORMALIZE RESPONSE
    return normalizeResponse(rawData, 'stock', 'current');
};
// ============= STOCK SERVICE =============
const getStockPriceHistory = async (query: Record<string, unknown>) => {
    const symbol = resolveStockSymbol(String(query.symbol || 'AAPL'));
    const interval = String(query.interval || '5min'); // 1min, 5min, 15min, 30min, 60min, daily

    const response = await axios.get(
        `https://www.alphavantage.co/query`,
        {
            params: {
                function: interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY',
                symbol,
                interval: interval === 'daily' ? undefined : interval,
                apikey: config.api.alphavantage_api_key,
                outputsize: 'compact'
            }
        }
    );

    const timeSeriesKey = interval === 'daily'
        ? 'Time Series (Daily)'
        : `Time Series (${interval})`;

    const timeSeries = response.data[timeSeriesKey];

    if (!timeSeries) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Stock data not found or API limit reached');
    }

    const entries = Object.entries(timeSeries).slice(0, 100);
    const prices = entries.map(([timestamp, data]: [string, any]) => ({
        timestamp,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume'])
    }));

    const firstPrice = prices[prices.length - 1].close;
    const lastPrice = prices[0].close;
    const changeRate = ((lastPrice - firstPrice) / firstPrice) * 100;

    const rawData = {
        type: 'stock',
        symbol,
        current: lastPrice,
        start: firstPrice,
        end: lastPrice,
        changeRate: parseFloat(changeRate.toFixed(2)),
        prices,
        source: 'Alpha Vantage'
    };
    return normalizeResponse(rawData, 'stock', 'history');
};

const getEconomicData = async (query: Record<string, unknown>) => {
    const seriesType = String(query.series || 'CPI').toUpperCase();
    const limit = Number(query.limit || 10);
    const seriesMap: Record<string, string> = {
        'CPI': 'CPIAUCSL',
        'TREASURY_10Y': 'DGS10',
        'GDP': 'GDP',
        'UNEMPLOYMENT': 'UNRATE',
        'INFLATION': 'FPCPITOTLZGUSA'
    };
    const seriesId = seriesMap[seriesType] || seriesType;
    const response = await axios.get(
        `https://api.stlouisfed.org/fred/series/observations`,
        {
            params: {
                series_id: seriesId,
                api_key: config.api.fred_api_key,
                file_type: 'json',
                sort_order: 'desc',
                limit
            }
        }
    );

    const observations = response.data.observations;

    if (!observations || observations.length === 0) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Economic data not found');
    }

    const validObs = observations.filter((obs: any) => obs.value !== '.');
    const latestValue = parseFloat(validObs[0]?.value || '0');
    const previousValue = parseFloat(validObs[1]?.value || '0');
    const changeRate = previousValue !== 0
        ? ((latestValue - previousValue) / previousValue) * 100
        : 0;

    const rawData = {
        series: seriesId,
        latestValue,
        previousValue,
        changeRate: parseFloat(changeRate.toFixed(2)),
        latestDate: validObs[0]?.date,
        data: validObs.slice(0, limit),
    };

    return normalizeResponse(rawData, 'economic');

};
const getSportsData = async (query: Record<string, unknown>) => {
    const league = String(query.league || 'nfl').toLowerCase();
    const playerId = query.playerId ? String(query.playerId) : null;
    const gameId = query.gameId ? String(query.gameId) : null;
    const season = String(query.season || '2024');

    // if (!playerId && !gameId) {
    //     throw new AppError(StatusCodes.BAD_REQUEST, 'Either playerId or gameId is required');
    // }

    const leagueEndpoints: Record<string, string> = {
        'nfl': `https://api.sportsdata.io/v3/nfl/stats/json/PlayerSeasonStats/${season}`,
        'nba': `https://api.sportsdata.io/v3/nba/stats/json/PlayerSeasonStats/${season}`,
        'mlb': `https://api.sportsdata.io/v3/mlb/stats/json/PlayerSeasonStats/${season}`
    };

    const endpoint = leagueEndpoints[league];
    if (!endpoint) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid league');
    }

    const response = await axios.get(endpoint, {
        params: { key: config.api.sportsDataIO }
    });
    console.log(response.data[0]);
    if (playerId) {
        const playerStats = response.data.find((p: any) =>
            String(p.PlayerID) === playerId ||
            p.Name?.toLowerCase().includes(playerId.toLowerCase())
        );

        if (!playerStats) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Player not found');
        }

        const rawData = {
            league: league.toUpperCase(),
            season,
            player: playerStats
        };

        return normalizeResponse(rawData, 'sports', 'player');
    } else {
        // Game logic would go here
        throw new AppError(StatusCodes.NOT_IMPLEMENTED, 'Game stats not implemented yet');
    }

};
const getEnergyData = async (query: Record<string, unknown>) => {
    const days = Number(query.days || 5);

    try {
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
                    length: days
                }
            }
        );

        const data = response.data.response.data;

        if (!data || data.length === 0) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Oil price data not found');
        }

        const latestPrice = parseFloat(data[0].value);
        const previousPrice = parseFloat(data[1]?.value || data[0].value);
        const changeRate = ((latestPrice - previousPrice) / previousPrice) * 100;

        const rawData = {
            commodity: 'WTI Crude Oil',
            currentPrice: latestPrice,
            previousPrice,
            changeRate: parseFloat(changeRate.toFixed(2)),
            date: data[0].period,
            history: data,
        };

        return normalizeResponse(rawData, 'energy');
    } catch (error: any) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
const getEntertainmentData = async (query: Record<string, unknown>) => {
    const movieId = query.movieId ? String(query.movieId) : null;
    const videoId = query.videoId ? String(query.videoId) : null;

    if (!movieId && !videoId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Either movieId or videoId is required');
    }

    if (movieId) {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}`,
            { params: { api_key: config.api.tmdb } }
        );
        const rawData = {
            title: response.data.title,
            releaseDate: response.data.release_date,
            revenue: response.data.revenue,
            budget: response.data.budget,
            popularity: response.data.popularity,
            voteAverage: response.data.vote_average,
        };

        return normalizeResponse(rawData, 'entertainment', 'movie');
    } else {
        const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos`,
            {
                params: {
                    part: 'statistics,snippet',
                    id: videoId,
                    key: config.api.youtube
                }
            }
        );

        const video = response.data.items?.[0];

        if (!video) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Video not found');
        }

        const rawData = {
            title: video.snippet.title,
            views: parseInt(video.statistics.viewCount),
            likes: parseInt(video.statistics.likeCount),
            comments: parseInt(video.statistics.commentCount),
            publishedAt: video.snippet.publishedAt,
        };

        return normalizeResponse(rawData, 'entertainment', 'youtube');
    }

};

const getUnifiedForecastData = async (query: Record<string, unknown>) => {
    const category = String(query.category || 'crypto').toLowerCase();

    try {
        switch (category) {
            case 'crypto':
                return await getCryptoPriceHistory(query);

            case 'stock':
                return await getStockPriceHistory(query);

            case 'economic':
                return await getEconomicData(query);

            case 'oil':
            case 'energy':
                return await getEnergyData(query);

            case 'sports':
                return await getSportsData(query);

            case 'entertainment':
                return await getEntertainmentData(query);

            default:
                throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid category');
        }
    } catch (error: any) {
        throw new AppError(
            error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            error.message || 'Failed to fetch forecast data'
        );
    }
};

export const ContestService = { createContest, getAllContests, getContestById, updateContest, deleteContest, publishContest, generateContestPredictions, getActiveContests, getPredictionTiers, getTiersContest, getContestByIdUser, getContestByCategoryId, getCryptoNews, getCryptoPriceHistory, getStockPriceHistory, getEconomicData, getSportsData, getEntertainmentData, getEnergyData, getUnifiedForecastData, shuffleContestSerial }
