import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Contest } from "../contest/contest.model";
import { Order } from "../order/order.model";
import { calculatePrizeForPlace, calculateWinners, updateOrderStatuses } from "./manuallyWinnerContest.helpers";
import QueryBuilder from "../../builder/QueryBuilder";

const determineContestWinners = async (contestId: string, actualValue: number) => {
    const contest = await Contest.findById(contestId);

    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }
    if (contest.endTime && contest.endTime < new Date()) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Contest has already ended'
        );
    }
    if (contest.results && contest.results.prizeDistributed) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Winners have already been determined for this contest'
        );
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
            actualValue: Number(actualValue),
            totalEntries: 0,
            winners: []
        }
    }

    // Calculate winners
    const winnersData = calculateWinners(contestOrders, Number(actualValue), contest);

    // Update contest with results
    contest.results.actualValue = Number(actualValue);
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
        actualValue: Number(actualValue),
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
    const pendingContests = await queryBuilder.paginate().sort().fields().filter().modelQuery.exec();



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
const resetContestResults = async (contestId: string, confirmReset: boolean) => {
    if (!confirmReset) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Please confirm reset by sending confirmReset: true'
        );
    }

    const contest = await Contest.findById(contestId);

    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Reset contest results
    contest.results.actualValue = undefined;
    contest.results.winningPredictions = [];
    contest.results.prizeDistributed = false;
    contest.results.endedAt = null;
    contest.status = 'Active';
    await contest.save();

    // Reset all order statuses back to 'complete'
    await Order.updateMany(
        {
            contestId: contest._id,
            status: { $in: ['won', 'lost'] }
        },
        {
            $set: { status: 'complete' }
        }
    );
}

const getContestOrdersDetails = async (contestId: string) => {
    // Check if contest exists
    const contest = await Contest.findById(contestId);

    if (!contest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Contest not found');
    }

    // Get all orders for this contest with user details populated
    const orders = await Order.find({
        contestId: contestId,
        isDeleted: false
    })
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 }); // Latest orders first

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const statusBreakdown = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get unique users count
    const uniqueUsers = new Set(orders.map(order => order.userId._id.toString())).size;

    // Calculate predictions statistics
    const allPredictions = orders.flatMap(order =>
        [...(order.predictions || []), ...(order.customPrediction || [])]
            .map(p => p.predictionValue)
    );

    const avgPrediction = allPredictions.length > 0
        ? allPredictions.reduce((sum, val) => sum + val, 0) / allPredictions.length
        : 0;

    const minPrediction = allPredictions.length > 0 ? Math.min(...allPredictions) : 0;
    const maxPrediction = allPredictions.length > 0 ? Math.max(...allPredictions) : 0;

    // Prepare detailed orders list
    const detailedOrders = orders.map(order => {
        // Combine predictions and custom predictions
        const allOrderPredictions = [
            ...(order.predictions || []).map(p => ({
                type: 'standard',
                predictionValue: p.predictionValue,
                tierId: typeof p.tierId === 'object' && p.tierId !== null ? (p.tierId as any)._id : p.tierId,
                tierName: typeof p.tierId === 'object' && p.tierId !== null ? (p.tierId as any).name : 'N/A',
                price: p.price
            })),
            ...(order.customPrediction || []).map(p => ({
                type: 'custom',
                predictionValue: p.predictionValue,
                tierId: typeof p.tierId === 'object' && p.tierId !== null ? (p.tierId as any)._id : p.tierId,
                tierName: (p.tierId as any)?.name || 'N/A',
                price: p.price
            }))
        ];

        return {
            orderId: order.orderId,
            _id: order._id,
            user: {
                userId: order.userId._id,
                name: (order.userId as any).name,
                email: (order.userId as any).email,
                phone: order.phone || (order.userId as any).phone
            },
            predictions: allOrderPredictions,
            totalPredictions: allOrderPredictions.length,
            totalAmount: order.totalAmount,
            state: order.state,
            status: order.status,
            paymentId: order.paymentId,
            result: order.result,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    });

    // State-wise distribution
    const stateDistribution = orders.reduce((acc, order) => {
        if (order.state) {
            acc[order.state] = (acc[order.state] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const data = {
        contest: {
            id: contest._id,
            name: contest.name,
            category: contest.category,
            description: contest.description,
            startTime: contest.startTime,
            endTime: contest.endTime,
            status: contest.status,
            prizePool: contest.prize?.prizePool || 0,
            actualValue: contest.results?.actualValue || null,
            prizeDistributed: contest.results?.prizeDistributed || false
        },
        statistics: {
            totalOrders,
            uniqueUsers,
            totalRevenue,
            averagePrediction: Math.round(avgPrediction * 100) / 100,
            minPrediction,
            maxPrediction,
            statusBreakdown,
            stateDistribution
        },
        orders: detailedOrders
    };

    return data;
};

export const ManuallyWinnerService = { determineContestWinners, getContestResults, getPendingContests, resetContestResults, getContestOrdersDetails }
