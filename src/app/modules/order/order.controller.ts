import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { OrderService } from './order.service';

// const createProductOrder = catchAsync(async (req, res) => {
//      const { id } = req.user as { id: string };
//      const result = await OrderService.createProductOrder(id, req.body);
//      sendResponse(res, {
//           statusCode: StatusCodes.CREATED,
//           success: true,
//           message: 'Order created successfully',
//           data: result,
//      });
// });

const getAllPredictionOrders = catchAsync(async (req, res) => {
     const result = await OrderService.getAllPredictionOrders(req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Orders retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const getSinglePredictionOrder = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await OrderService.getSinglePredictionOrder(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Order retrieved successfully',
          data: result,
     });
});

const updateProductOrder = catchAsync(async (req, res) => {
     const { id } = req.params;
     // const result = await OrderService.updateProductOrder(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Order updated successfully',
          // data: result,
     });
});

// const cancelProductOrder = catchAsync(async (req, res) => {
//      const { id } = req.params;
//      const result = await ProductOrderService.cancelProductOrder(id);

//      sendResponse(res, {
//           statusCode: StatusCodes.OK,
//           success: true,
//           message: 'Order canceled successfully',
//           data: result,
//      });
// });

const createCheckoutSession = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const { orderId } = req.params;
     const result = await OrderService.createCheckoutSession(orderId, id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Checkout session created successfully',
          data: {
               sessionId: result.sessionId,
               url: result.url,
          },
     });
});

const orderSuccess = catchAsync(async (req, res) => {
     // Render success page or redirect to frontend success page
     res.render('success');
});

const orderCancel = catchAsync(async (req, res) => {
     // Render cancel page or redirect to frontend cancel page
     res.render('cancel');
});

const getUserOrders = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await OrderService.getUserOrders(id, req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User orders retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const createOrderAndCheckout = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await OrderService.createOrderAndCheckout(id, req.body);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Order created and checkout session generated successfully',
          data: {
               sessionId: result.sessionId,
               url: result.url,
          },
     });
});
const analysisOrders = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await OrderService.analysisOrders(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Order analysis retrieved successfully',
          data: result,
     });
});

// const pastAnalysisOrders = catchAsync(async (req, res) => {
//      const { id } = req.user as { id: string };
//      const result = await OrderService.pastAnalysisOrders(id);
//      sendResponse(res, {
//           statusCode: StatusCodes.OK,
//           success: true,
//           message: 'Order analysis retrieved successfully',
//           data: result,
//      });
// });

const getWinnerOrders = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await OrderService.getWinnerOrders(id, req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Winner orders retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

const getPastOrderAnalysis = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await OrderService.getPastOrderAnalysis(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Past order analysis retrieved successfully',
          data: result,
     });
});

export const OrderController = {
     // createProductOrder,
     getAllPredictionOrders,
     getSinglePredictionOrder,
     updateProductOrder,
     // pastAnalysisOrders,
     getWinnerOrders,
     // cancelProductOrder,
     getPastOrderAnalysis,
     analysisOrders,
     createCheckoutSession,
     orderSuccess,
     orderCancel,
     getUserOrders,
     createOrderAndCheckout,
};
