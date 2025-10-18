export const calculateWinners = (orders: any[], actualValue: number, contest: any) => {
    // Collect all predictions from all orders
    const predictions = orders.flatMap(order => {
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
    predictions.sort((a, b) => {
        if (a.difference !== b.difference) {
            return a.difference - b.difference;
        }
        // If differences are equal, sort by earlier entry (order ID)
        return a.orderId.toString().localeCompare(b.orderId.toString());
    });

    // Get place percentages from contest
    const placePercentages = contest.predictions.placePercentages || new Map();
    const prizePool = contest.prize.prizePool;

    // Determine winners based on place percentages
    const places = Array.from(placePercentages.keys())
        .map(p => parseInt(p as string))
        .sort((a, b) => a - b);

    const winners: any[] = [];
    const winningOrderIds: any[] = [];
    const usedOrders = new Set<string>();

    // Assign winners for each place
    places.forEach(place => {
        // Find the next best prediction from an order that hasn't won yet
        const pred = predictions.find(p => !usedOrders.has(p.orderId.toString()));

        if (pred) {
            const percentage = placePercentages.get(place.toString()) || 0;
            const prizeAmount = (prizePool * percentage) / 100;

            winners.push({
                orderId: pred.orderId,
                userId: pred.userId,
                place: place,
                predictionValue: pred.predictionValue,
                actualValue: actualValue,
                difference: pred.difference,
                prizeAmount: prizeAmount,
                percentage: percentage
            });

            winningOrderIds.push(pred.orderId);
            usedOrders.add(pred.orderId.toString());
        }
    });

    return { winners, winningOrderIds };
}
export const updateOrderStatuses = async (orders: any[], winningOrderIds: any[]) => {
    const winningIds = new Set(winningOrderIds.map(id => id.toString()));

    const updatePromises = orders.map(order => {
        const isWinner = winningIds.has(order._id.toString());
        order.status = isWinner ? 'won' : 'lost';
        return order.save();
    });

    await Promise.all(updatePromises);
}

export const calculatePrizeForPlace = (contest: any, place: number): number => {
    const placePercentages = contest.predictions.placePercentages || new Map();
    const percentage = placePercentages.get(place.toString()) || 0;
    return (contest.prize.prizePool * percentage) / 100;
}