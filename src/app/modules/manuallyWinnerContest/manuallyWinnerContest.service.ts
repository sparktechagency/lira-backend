import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { Contest } from "../contest/contest.model";

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


}
export const ManuallyWinnerService = { determineContestWinners }
