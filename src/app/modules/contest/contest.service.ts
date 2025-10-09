import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest, US_STATES } from "./contest.interface";
import { Contest } from "./contest.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Category } from "../category/category.model";
import { User } from "../user/user.model";
import { USER_ROLES } from "../../../enums/user";
import { getCryptoPrice, getStockPrice } from "./contest.api";
import axios from "axios";
import config from "../../../config";

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
        console.log('Critical prediction fields being updated - will trigger regeneration');

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
const publishContest = async (id: string) => {

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }


    // Generate predictions before publishing
    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        console.log('No generated predictions found - auto-generating before publish');
        await contest.generatePredictions();
    }
    // Validate that predictions were generated successfully
    if (!contest.predictions.generatedPredictions || contest.predictions.generatedPredictions.length === 0) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Cannot publish contest: No predictions could be generated. Check prediction ranges and tiers.'
        );
    }
    if (contest.status === 'Active') {
        contest.status = 'Draft';
    } else {
        contest.status = 'Active';
    }
    const result = await contest.save();

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

    const notAllowedFields = "-predictions.generatedPredictions -pricing.tiers -results -predictions.placePercentages -predictions.numberOfEntriesPerPrediction -predictions.unit -predictions.increment -createdBy -createdAt -updatedAt -maxEntries -startTime -status -description -categoryId -serial";

    const result = await queryBuilder
        .priceRange()
        .fields()
        .filter()
        .search(["name", "category"])
        .prizeTypeFilter()
        .sort()
        .modelQuery
        .select(notAllowedFields)
        .lean()
        .exec();

    const meta = await queryBuilder.countTotal();

    return {
        meta,
        result
    };
};


const getTiersContest = async (id: string) => {
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    const result = contest?.pricing;

    return result;
}
const getPredictionTiers = async (contestId: string, tierId: string) => {
    const result = await Contest.findById(contestId);
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Prediction not found');
    }
    const tier = result.predictions.generatedPredictions.filter((tier) => tier.tierId === tierId);
    if (!tier) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Tier not found');
    }
    return tier;
};

const getContestByIdUser = async (id: string, userId: string) => {
    // Run queries in parallel for better performance
    const [isExistUser, result] = await Promise.all([
        User.findById(userId).select('state role').lean(),
        Contest.findById(id).select('title description entryFee endTime state image prize').lean()
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
    // if (isExistUser.role === USER_ROLES.SUPER_ADMIN) {
    //     return result;
    // }
    // if (!result.state.includes(isExistUser.state as US_STATES)) {
    //     throw new AppError(
    //         StatusCodes.FORBIDDEN,
    //         'This contest is not available in your state'
    //     );
    // }
    const getCategory = await Category.findById(result.categoryId);
    // const cryptoPrice = await getCryptoPrice('bitcoin');
    // const graph = await getCryptoPriceHistory('bitcoin', 'usd', 365)
    // const stockPrice = await getStockPrice('AAPL');
    // console.log(graph);
    // console.log(cryptoPrice);
    // console.log(stockPrice);
    // return result;
}

const getContestByCategoryId = async (id: string) => {
    const result = await Contest.find({ categoryId: id }).sort("serial").select("name category createdBy createdAt updatedAt maxEntries endTime status categoryId serial");
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
}

const getCryptoNews = async () => {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=${config.api.alphavantage_api_key}`;
    const response = await axios.get(url);
    return response.data.feed;

};
const getCryptoPriceHistory = async (query: Record<string, unknown>) => {
    const { crypto = "bitcoin", days = 1 } = query;
    if (!crypto || !days) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Crypto or days is missing');
    }
    const url = `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);
    const prices = response.data.prices; // [timestamp, price]

    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    const changeRate = ((lastPrice - firstPrice) / firstPrice) * 100; // percent change

    return {
        prices,                     // chart data
        current: lastPrice,         // latest price
        start: firstPrice,          // start price
        changeRate: changeRate,     // % change
    };

}

export const ContestService = { createContest, getAllContests, getContestById, updateContest, deleteContest, publishContest, generateContestPredictions, getActiveContests, getPredictionTiers, getTiersContest, getContestByIdUser, getContestByCategoryId, getCryptoNews, getCryptoPriceHistory }
