import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Contest } from "../contest/contest.model";
import { contestResultService } from "../result/result.service";
import { Order } from "../order/order.model";

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

}
export const ManuallyWinnerService = { determineContestWinners }
