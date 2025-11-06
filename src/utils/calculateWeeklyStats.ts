export const calculateWeeklyStats = (orders: any[], contests: any[]) => {
    const totalEntries = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const wonOrders = orders.filter(o => o.status === 'won');
    const totalWinnings = wonOrders.reduce((sum, order) => sum + (order.result?.prizeAmount || 0), 0);

    const completedContests = contests.filter(c => c.status === 'Completed').length;
    const activeContests = contests.filter(c => c.status === 'Active').length;

    // Find best performance
    const bestEntry = orders.reduce((best, order) => {
        if (!best || (order.result?.prizeAmount || 0) > (best.result?.prizeAmount || 0)) {
            return order;
        }
        return best;
    }, null);

    // Most participated category
    const categoryCount = orders.reduce((acc, order) => {
        acc[order.category] = (acc[order.category] || 0) + 1;
        return acc;
    }, {});

    const favoriteCategory = Object.entries(categoryCount)
        .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'N/A';

    return {
        totalEntries,
        totalSpent,
        totalWinnings,
        netProfit: totalWinnings - totalSpent,
        completedContests,
        activeContests,
        wonContests: wonOrders.length,
        winRate: totalEntries > 0 ? ((wonOrders.length / totalEntries) * 100).toFixed(1) : '0',
        favoriteCategory,
        bestEntry: bestEntry ? {
            contestName: bestEntry.contestName,
            prizeAmount: bestEntry.result?.prizeAmount || 0
        } : null
    };
}