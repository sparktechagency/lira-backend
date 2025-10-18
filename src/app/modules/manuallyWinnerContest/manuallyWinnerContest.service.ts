import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Contest } from "../contest/contest.model";
import { contestResultService } from "../result/result.service";

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

}
export const ManuallyWinnerService = { determineContestWinners }
