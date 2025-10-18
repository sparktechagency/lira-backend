import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Contest } from "../contest/contest.model";
import { contestResultService } from "../result/result.service";
import { Order } from "../order/order.model";
import { calculatePrizeForPlace, calculateWinners, updateOrderStatuses } from "./manuallyWinnerContest.helpers";
import QueryBuilder from "../../builder/QueryBuilder";

const determineContestWinners = async (contestId: string, actualValue: number) => {
    const contest = await Contest.findById(contestId);

    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    if (contest.results && contest.results.prizeDistributed) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Winners have already been determined for this contest'
        );
    }
    let finalActualValue: number;

    if (actualValue !== undefined && actualValue !== null) {
        finalActualValue = Number(actualValue);
        console.log(`📝 Using admin-provided actual value: ${finalActualValue}`);
    } else {
        console.log(`🔍 Fetching actual value from API...`);
        const fetchedValue = await contestResultService.fetchContestResult(contest);

        if (fetchedValue === null) {
            throw new AppError(
                StatusCodes.SERVICE_UNAVAILABLE,
                'Could not fetch actual result value. Please provide it manually.'
            );
        }

        finalActualValue = fetchedValue;
    }
    // Get all valid orders for this contest
    const contestOrders = await Order.find({
        contestId: contest._id,
        status: { $nin: ['cancelled'] },
        isDeleted: false
    }).populate('userId', 'name email');

    if (contestOrders.length === 0) {
        // No entries - just finalize the contest
        contest.results.actualValue = actualValue;
        contest.results.winningPredictions = [];
        contest.results.prizeDistributed = true;
        contest.results.endedAt = new Date();
        contest.status = 'Completed';
        await contest.save();

        return {
            contestId: contest._id,
            actualValue: finalActualValue,
            totalEntries: 0,
            winners: []
        }
    }

    // Calculate winners
    const winnersData = calculateWinners(contestOrders, finalActualValue, contest);

    // Update contest with results
    contest.results.actualValue = finalActualValue;
    contest.results.winningPredictions = winnersData.winningOrderIds;
    contest.results.prizeDistributed = true;
    contest.results.endedAt = new Date();
    contest.status = 'Completed';
    await contest.save();

    // Update order statuses
    await updateOrderStatuses(contestOrders, winnersData.winningOrderIds);

    // Log winner information
    console.log(`✅ Winners determined for contest: ${contest.name}`);
    winnersData.winners.forEach(winner => {
        console.log(
            `   🏆 Place ${winner.place}: ${winner.userId.name} - ` +
            `Predicted: ${winner.predictionValue}, Actual: ${winner.actualValue}, ` +
            `Difference: ${winner.difference}, Prize: ${winner.prizeAmount}`
        );
    });

    const data = {
        contestId: contest._id,
        contestName: contest.name,
        actualValue: finalActualValue,
        totalEntries: contestOrders.length,
        totalWinners: winnersData.winners.length,
        prizePool: contest.prize.prizePool,
        winners: winnersData.winners.map(w => ({
            place: w.place,
            userId: w.userId._id,
            userName: w.userId.name,
            userEmail: w.userId.email,
            predictionValue: w.predictionValue,
            actualValue: w.actualValue,
            difference: w.difference,
            prizeAmount: w.prizeAmount,
            prizePercentage: w.percentage
        }))
    }

    return data;

}
const getContestResults = async (contestId: string) => {
    const contest = await Contest.findById(contestId)
        .populate('results.winningPredictions');

    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    if (!contest.results.prizeDistributed) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Winners have not been determined yet for this contest'
        );
    }

    // Get winning orders with user details
    const winningOrders = await Order.find({
        _id: { $in: contest.results.winningPredictions }
    }).populate('userId', 'name email');

    // Get all entries for statistics
    const allOrders = await Order.find({
        contestId: contest._id,
        isDeleted: false
    });

    const totalEntries = allOrders.length;
    const wonEntries = allOrders.filter(o => o.status === 'won').length;
    const lostEntries = allOrders.filter(o => o.status === 'lost').length;
    const data = {
        contest: {
            id: contest._id,
            name: contest.name,
            category: contest.category,
            actualValue: contest.results.actualValue,
            endedAt: contest.results.endedAt,
            prizePool: contest.prize.prizePool
        },
        statistics: {
            totalEntries,
            wonEntries,
            lostEntries,
            totalWinners: winningOrders.length
        },
        winners: winningOrders.map((order, index) => {
            const prediction = [...(order.predictions || []), ...(order.customPrediction || [])]
                .find(p => Math.abs(p.predictionValue - contest.results.actualValue!) ===
                    Math.min(...[...(order.predictions || []), ...(order.customPrediction || [])]
                        .map(p => Math.abs(p.predictionValue - contest.results.actualValue!))));

            return {
                place: index + 1,
                orderId: order._id,
                userId: order.userId._id,
                userName: (order.userId as any).name,
                userEmail: (order.userId as any).email,
                predictionValue: prediction?.predictionValue,
                actualValue: contest.results.actualValue,
                difference: Math.abs((prediction?.predictionValue ?? 0) - contest.results.actualValue!),
                prizeAmount: calculatePrizeForPlace(contest, index + 1)
            };
        })
    }

    return data;

}

const getPendingContests = async (query: Record<string, unknown>) => {
    const now = new Date();
    const queryBuilder = new QueryBuilder(Contest.find({
        status: 'Active',
        endTime: { $lte: now },
        'results.prizeDistributed': false
    }).populate('categoryId'), query)
    const pendingContests = await queryBuilder.modelQuery.exec();



    const contestsWithStats = await Promise.all(
        pendingContests.map(async (contest) => {
            const entryCount = await Order.countDocuments({
                contestId: contest._id,
                isDeleted: false,
                status: { $nin: ['cancelled'] }
            });
            return {
                id: contest._id,
                name: contest.name,
                category: contest.category,
                endTime: contest.endTime,
                prizePool: contest.prize.prizePool,
                totalEntries: entryCount,
                hasMetadata: !!contest.metadata
            };
        })
    );
    const meta = await queryBuilder.countTotal()
    return {
        meta,
        result: contestsWithStats
    };
}

export const ManuallyWinnerService = { determineContestWinners, getContestResults, getPendingContests }
