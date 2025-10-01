import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { IContest } from "./contest.interface";
import { Contest } from "./contest.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { Category } from "../category/category.model";

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

    if (contest.status !== 'Draft') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Contest is already published');
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

    contest.status = 'Active';
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
    const queryBuilder = new QueryBuilder(Contest.find({
        status: 'Active',
        // startTime: { $lte: new Date() },
        // endTime: { $gte: new Date() }
    }), query);
    const notAllowedFields = "-predictions.generatedPredictions -pricing.tiers -results -state -predictions.placePercentages -predictions.numberOfEntriesPerPrediction -predictions.unit -predictions.increment -createdBy -createdAt -updatedAt -maxEntries -startTime -status -description -categoryId -serial";

    const result = await queryBuilder.priceRange().fields().filter().search(["name", "category"]).prizeTypeFilter().sort().modelQuery.select(notAllowedFields).exec();
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

const getContestByIdUser = async (id: string) => {
    const result = await Contest.findById(id).select("-predictions.generatedPredictions -pricing.tiers -results -state -predictions.placePercentages -predictions.numberOfEntriesPerPrediction -predictions.unit -predictions.increment -createdBy -createdAt -updatedAt -maxEntries -startTime -status -categoryId -serial");
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
}
const getContestByCategoryId = async (id: string) => {
    const result = await Contest.find({ categoryId: id }).sort("serial").select("name category createdBy createdAt updatedAt maxEntries endTime status categoryId serial");
    if (!result) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    return result;
}
export const ContestService = { createContest, getAllContests, getContestById, updateContest, deleteContest, publishContest, generateContestPredictions, getActiveContests, getPredictionTiers, getTiersContest, getContestByIdUser, getContestByCategoryId }
