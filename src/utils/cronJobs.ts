import cron from 'node-cron';
import { Contest } from '../app/modules/contest/contest.model';
import { Order } from '../app/modules/order/order.model';
import { printBanner } from './printBanner';
import config from '../config';
import { contestResultService } from '../app/modules/result/result.service';

/**
 * Determines winners for contests that have ended
 * This job runs every minute to check for newly ended contests
 */
const determineContestWinners = async () => {
     try {
          console.log('🏆 Checking for contests that need winner determination...');
          // Find all contests that:
          // 1. Have status 'Active'
          // 2. Have ended (endTime <= now)
          // 3. Don't have winners determined yet (prizeDistributed: false)
          const now = new Date();
          console.log(now, 'Checking for contests that need winner determination...');
          const endedContests = await Contest.find({
               status: 'Active',
               endTime: { $lte: now },
               'results.prizeDistributed': false
          });

          if (endedContests.length === 0) {
               console.log('✅ No contests need winner determination at this time');
               return;
          }

          console.log(`📊 Found ${endedContests.length} contest(s) to process`);

          for (const contest of endedContests) {
               try {
                    await processContestWinners(contest);
               } catch (error) {
                    console.error(`❌ Error processing contest ${contest._id}:`, error);
                    // Continue with next contest even if one fails
               }
          }

     } catch (error) {
          console.error('❌ Error in winner determination cron job:', error);
     }
};

/**
 * Process winners for a single contest
 */
const processContestWinners = async (contest: any) => {
     console.log(`\n🎯 Processing contest: ${contest.name} (ID: ${contest._id})`);

     // 1. Fetch the actual result value from external API
     const actualValue = await fetchActualResultValue(contest);

     if (actualValue === null) {
          console.log(`⚠️ Could not fetch actual value for contest ${contest._id}. Will retry later.`);
          return;
     }

     console.log(`📈 Actual result value: ${actualValue}`);

     // 2. Find all orders/entries for this contest
     const contestOrders = await Order.find({
          contestId: contest._id,
          status: { $nin: ['cancelled'] },
          isDeleted: false
     }).populate('userId', 'name email');

     if (contestOrders.length === 0) {
          console.log(`ℹ️ No entries found for contest ${contest._id}`);
          await finalizeContestWithNoEntries(contest, actualValue);
          return;
     }

     console.log(`👥 Found ${contestOrders.length} entries to evaluate`);

     // 3. Calculate winners based on prediction accuracy
     const winnersData = calculateWinners(contestOrders, actualValue, contest);

     // 4. Update contest with results
     contest.results.actualValue = actualValue;
     contest.results.winningPredictions = winnersData.winningOrderIds;
     contest.results.prizeDistributed = true;
     contest.results.endedAt = new Date();
     contest.status = 'Completed';
     await contest.save();

     // 5. Update all orders with win/loss status
     await updateOrderStatuses(contestOrders, winnersData.winningOrderIds, winnersData.winners);

     // 6. Distribute prizes (if implemented)
     if (winnersData.winners.length > 0) {
          await distributePrizes(contest, winnersData.winners);
     }
};

/**
 * Fetch actual result value from external APIs based on contest category
 */
const fetchActualResultValue = async (contest: any): Promise<number | null> => {
     try {

          // Use the service to fetch the result
          return await contestResultService.fetchContestResult(contest);
     } catch (error) {
          console.error(`❌ Error fetching actual value for contest ${contest._id}:`, error);
          return null;
     }
};

/**
 * Calculate winners based on prediction accuracy
 */
const calculateWinners = (orders: any[], actualValue: number, contest: any) => {
     // Calculate absolute difference for each prediction
     const predictions = orders.flatMap(order => {
          // Handle both prediction formats
          const allPredictions = [
               ...(order.predictions || []),
               ...(order.customPrediction || [])
          ];

          return allPredictions.map(pred => ({
               orderId: order._id,
               userId: order.userId,
               predictionValue: pred.predictionValue,
               price: pred.price,
               difference: Math.abs(pred.predictionValue - actualValue)
          }));
     });

     // Sort by difference (closest first)
     predictions.sort((a, b) => a.difference - b.difference);

     // Get place percentages from contest
     const placePercentages = contest.predictions.placePercentages || new Map();
     const prizePool = contest.prize.prizePool;

     // Determine number of winners based on place percentages
     const places = Array.from(placePercentages.keys()).sort((a, b) =>
          parseInt(a as string) - parseInt(b as string)
     );

     const winners: any[] = [];
     const winningOrderIds: any[] = [];

     places.forEach(place => {
          const placeIndex = parseInt(place as string) - 1;
          if (predictions[placeIndex]) {
               const pred = predictions[placeIndex];
               const percentage = placePercentages.get(place) || 0;
               const prizeAmount = (prizePool * percentage) / 100;

               winners.push({
                    orderId: pred.orderId,
                    userId: pred.userId,
                    place: parseInt(place as string),
                    predictionValue: pred.predictionValue,
                    actualValue: actualValue,
                    difference: pred.difference,
                    prizeAmount: prizeAmount,
                    percentage: percentage
               });

               winningOrderIds.push(pred.orderId);
          }
     });

     return { winners, winningOrderIds };
};

/**
 * Update order statuses based on win/loss
 */
const updateOrderStatuses = async (orders: any[], winningOrderIds: any[], winners: any[]) => {
     // const winningIds = winningOrderIds.map(id => id.toString());
     for (const order of orders) {
          // const user = await User.findById(order.userId);
          // const isWinner = winningIds.includes(order._id.toString());
            const isWinner = winningOrderIds.some(id => id.equals(order._id));
          order.status = isWinner ? 'won' : 'lost';
          order.result = {
               place: isWinner ? winners.find(w => w.orderId === order._id).place : null,
               predictionValue: isWinner ? winners.find(w => w.orderId === order._id).predictionValue : 0,
               actualValue: isWinner ? winners.find(w => w.orderId === order._id).actualValue : 0,
               difference: isWinner ? winners.find(w => w.orderId === order._id).difference : 0,
               prizeAmount: isWinner ? winners.find(w => w.orderId === order._id).prizeAmount : 0,
               percentage: isWinner ? winners.find(w => w.orderId === order._id).percentage : 0
          }
          await order.save();
     }
};

/**
 * Distribute prizes to winners (placeholder - implement based on your payment system)
 */
const distributePrizes = async (contest: any, winners: any[]) => {
     console.log(`\n💰 Distributing prizes for contest: ${contest.name}`);

     for (const winner of winners) {
          console.log(`   🏆 Place ${winner.place}: User ${winner.userId._id} wins $${winner.prizeAmount.toFixed(2)}`);

          // TODO: Implement actual prize distribution
          // This could involve:
          // - Creating a payment/transaction record
          // - Updating user wallet/balance
          // - Sending notification email
          // - Creating a prize claim record

          // Example:
          // await createPrizeTransaction({
          //     userId: winner.userId,
          //     contestId: contest._id,
          //     amount: winner.prizeAmount,
          //     place: winner.place
          // });
     }
};

/**
 * Finalize contest when no entries exist
 */
const finalizeContestWithNoEntries = async (contest: any, actualValue: number) => {
     contest.results.actualValue = actualValue;
     contest.results.winningPredictions = [];
     contest.results.prizeDistributed = true;
     contest.results.endedAt = new Date();
     contest.status = 'Completed';
     await contest.save();

     console.log(`✅ Contest ${contest._id} finalized with no entries`);
};

// ==================== API FETCH FUNCTIONS ====================
// These are placeholders - implement based on your API services

const fetchCryptoPrice = async (contest: any): Promise<number | null> => {
     // TODO: Extract crypto symbol from contest metadata
     // Call your getCryptoPriceHistory or similar service
     return null;
};

const fetchStockPrice = async (contest: any): Promise<number | null> => {
     // TODO: Extract stock symbol from contest metadata
     // Call your getStockCurrentPrice or similar service
     return null;
};

const fetchSportsData = async (contest: any): Promise<number | null> => {
     // TODO: Extract sports data identifiers from contest metadata
     // Call your getSportsData service
     return null;
};

const fetchEconomicData = async (contest: any): Promise<number | null> => {
     // TODO: Extract economic indicator from contest metadata
     // Call your getEconomicData service
     return null;
};

const fetchEnergyPrice = async (contest: any): Promise<number | null> => {
     // TODO: Call your getEnergyData service
     return null;
};

const fetchEntertainmentData = async (contest: any): Promise<number | null> => {
     // TODO: Extract movie/video ID from contest metadata
     // Call your getEntertainmentData service
     return null;
};

// ====== CRON JOB SCHEDULERS ======

const winnerCheck = () => {
     // Run every minute to check for ended contests
     cron.schedule('*/1 * * * *', determineContestWinners);
     console.log('✅ Winner determination cron job scheduled (runs every minute)');
};

const setupTimeManagement = () => {
     console.log('🚀 Setting up contest management cron jobs...');
     printBanner(config.server.name as string);
     winnerCheck();
};

export default setupTimeManagement;