import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentService } from './payments.service';

const createPayment = catchAsync(async (req, res) => {
     const result = await PaymentService.createPayment(req.body);

     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: 'Payment created successfully',
          data: result,
     });
});

const getAllPayments = catchAsync(async (req, res) => {
     const result = await PaymentService.getAllPayments(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Payments retrieved successfully',
          data: result,
     });
});

const getSinglePayment = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await PaymentService.getSinglePayment(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Payment retrieved successfully',
          data: result,
     });
});

const updatePayment = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await PaymentService.updatePayment(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Payment updated successfully',
          data: result,
     });
});

const deletePayment = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await PaymentService.deletePayment(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Payment deleted successfully',
          data: result,
     });
});

export const PaymentController = {
     createPayment,
     getAllPayments,
     getSinglePayment,
     updatePayment,
     deletePayment,
};
