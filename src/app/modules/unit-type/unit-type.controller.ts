import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleService } from './unit-type.service';

//privacy policy
const createPrivacyPolicy = catchAsync(async (req, res) => {
     const { ...privacyData } = req.body;
     const result = await RuleService.createPrivacyPolicyToDB(privacyData);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Privacy policy created successfully',
          data: result,
     });
});

const getPrivacyPolicy = catchAsync(async (req, res) => {
     const result = await RuleService.getPrivacyPolicyFromDB();

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Privacy policy retrieved successfully',
          data: result,
     });
});



export const RuleController = {
     createPrivacyPolicy,
     getPrivacyPolicy,
};
