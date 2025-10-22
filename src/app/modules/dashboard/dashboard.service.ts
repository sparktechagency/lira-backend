// Service
import { Order } from '../order/order.model';
import { User } from '../user/user.model';
import { AnalyticsFilters } from './dashboard.interface';


const getAnalytics = async (filters: AnalyticsFilters) => {
    // Build date filter
    const dateFilter = buildDateFilter(filters);

    // Build match query for orders
    const orderMatchQuery: any = {
        isDeleted: false,
        ...dateFilter,
    };

    // Add region filter if provided
    if (filters.region && filters.region !== 'All Regions') {
        orderMatchQuery.state = filters.region;
    }

    // Add product filter if provided
    if (filters.product && filters.product !== 'All Products') {
        orderMatchQuery.contestName = filters.product;
    }

    // Build user match query
    const userMatchQuery: any = { isDeleted: false };
    if (filters.region && filters.region !== 'All Regions') {
        userMatchQuery.state = filters.region;
    }

    // Parallel execution of all analytics queries
    const [
        financialMetrics,
        revenueOverTime,
        topProductsByRevenue,
        entryPriceSensitivity,
        userEngagement,
        newUsersThisWeek,
        highActivityUsers,
        loyaltyMetrics,
        topUsersBySpend,
        goldStreakLeaders,
        coldStreakUsers,
        geographicDistribution,
    ] = await Promise.all([
        getFinancialMetrics(orderMatchQuery),
        getRevenueOverTime(orderMatchQuery),
        getTopProductsByRevenue(orderMatchQuery),
        getEntryPriceSensitivity(orderMatchQuery),
        getUserEngagement(orderMatchQuery, userMatchQuery, dateFilter),
        getNewUsersThisWeek(userMatchQuery),
        getHighActivityUsers(orderMatchQuery),
        getLoyaltyMetrics(orderMatchQuery),
        getTopUsersBySpend(orderMatchQuery),
        getGoldStreakLeaders(orderMatchQuery),
        getColdStreakUsers(orderMatchQuery, userMatchQuery),
        getGeographicDistribution(orderMatchQuery, userMatchQuery),
    ]);

    return {
        filters: filters,
        financialPerformance: {
            totalRevenue: financialMetrics.totalRevenue,
            avgRevenuePerUser: financialMetrics.avgRevenuePerUser,
            avgOrderValue: financialMetrics.avgOrderValue,
        },
        revenueOverTime,
        topProductsByRevenue,
        entryPriceSensitivity,
        userEngagementAndGrowth: userEngagement,
        userActivity: {
            newUsersThisWeek,
            highActivityUsers,
        },
        loyaltyMetrics: {
            loyaltyAndStreakBehavior: loyaltyMetrics,
            topUsersBySpend,
            goldStreakLeaders,
            coldStreakUsers,
        },
        geographicDistribution,
    };
};

// Helper function to build date filter
const buildDateFilter = (filters: AnalyticsFilters) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (filters.startDate && filters.endDate) {
        startDate = new Date(filters.startDate);
        endDate = new Date(filters.endDate);
    } else if (filters.dateRange) {
        switch (filters.dateRange) {
            case 'Last Week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'Last Month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'Last 3 Months':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'Last 6 Months':
                startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case 'Last Year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
        createdAt: {
            $gte: startDate,
            $lte: endDate,
        },
    };
};

// Financial Metrics
const getFinancialMetrics = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
            },
        },
        {
            $project: {
                totalRevenue: 1,
                avgOrderValue: { $divide: ['$totalRevenue', '$totalOrders'] },
                avgRevenuePerUser: {
                    $divide: ['$totalRevenue', { $size: '$uniqueUsers' }],
                },
            },
        },
    ]);

    return result[0] || { totalRevenue: 0, avgRevenuePerUser: 0, avgOrderValue: 0 };
};

// Revenue Over Time
const getRevenueOverTime = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                revenue: { $sum: '$totalAmount' },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: '$_id',
                revenue: 1,
                _id: 0,
            },
        },
    ]);

    return result;
};

// Top Products by Revenue
const getTopProductsByRevenue = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$contestName',
                revenue: { $sum: '$totalAmount' },
            },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
            $project: {
                product: '$_id',
                revenue: 1,
                _id: 0,
            },
        },
    ]);

    return result;
};

// Entry Price Sensitivity
const getEntryPriceSensitivity = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: matchQuery },
        {
            $bucket: {
                groupBy: '$totalAmount',
                boundaries: [0, 2, 5, 10, 1000000],
                default: 'Other',
                output: {
                    totalSellRate: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                },
            },
        },
        {
            $project: {
                _id: 0,
                priceRange: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id', 0] }, then: '0-2' },
                            { case: { $eq: ['$_id', 2] }, then: '2-5' },
                            { case: { $eq: ['$_id', 5] }, then: '5-10' },
                            { case: { $eq: ['$_id', 10] }, then: '10+' },
                        ],
                        default: 'Other',
                    },
                },
                totalSellRate: 1,
                revenue: 1,
                amplifier: {
                    $cond: {
                        if: { $eq: ['$_id', 0] },
                        then: 2.5,
                        else: {
                            $cond: {
                                if: { $eq: ['$_id', 2] },
                                then: 1.6,
                                else: {
                                    $cond: {
                                        if: { $eq: ['$_id', 5] },
                                        then: 1.2,
                                        else: 0.8,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    ]);

    return result;
};

// User Engagement
const getUserEngagement = async (
    orderMatchQuery: any,
    userMatchQuery: any,
    dateFilter: any
) => {
    const previousPeriodFilter = getPreviousPeriodFilter(dateFilter);

    const [currentMetrics, previousMetrics] = await Promise.all([
        calculateEngagementMetrics(orderMatchQuery, userMatchQuery),
        calculateEngagementMetrics(
            { ...orderMatchQuery, createdAt: previousPeriodFilter },
            userMatchQuery
        ),
    ]);

    return {
        activeUsers: {
            value: Number(currentMetrics.activeUsers.toFixed(2)),
            change: calculatePercentageChange(
                previousMetrics.activeUsers,
                currentMetrics.activeUsers
            ),
        },
        repeatUsers: {
            value: Number(currentMetrics.repeatUsersPercentage.toFixed(2)),
            change: calculatePercentageChange(
                previousMetrics.repeatUsersPercentage,
                currentMetrics.repeatUsersPercentage
            ),
        },
        conversionRate: {
            value: Number(currentMetrics.conversionRate.toFixed(2)),
            change: calculatePercentageChange(
                previousMetrics.conversionRate,
                currentMetrics.conversionRate
            ),
        },
        abandonmentRate: {
            value: Number(currentMetrics.abandonmentRate.toFixed(2)),
            change: calculatePercentageChange(
                previousMetrics.abandonmentRate,
                currentMetrics.abandonmentRate
            ),
        },
        avgTimeToFirst: {
            value: Number(currentMetrics.avgTimeToFirst.toFixed(2)),
            change: calculateDaysChange(
                previousMetrics.avgTimeToFirst,
                currentMetrics.avgTimeToFirst
            ),
        },
    };
};

const calculateEngagementMetrics = async (orderMatchQuery: any, userMatchQuery: any) => {
    const [activeUsersResult, repeatUsersResult, conversionResult, avgTimeResult] =
        await Promise.all([
            Order.distinct('userId', orderMatchQuery),
            Order.aggregate([
                { $match: orderMatchQuery },
                {
                    $group: {
                        _id: '$userId',
                        orderCount: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        repeat: {
                            $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] },
                        },
                    },
                },
            ]),
            User.countDocuments(userMatchQuery),
            Order.aggregate([
                { $match: orderMatchQuery },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: '$user' },
                {
                    $project: {
                        daysDiff: {
                            $divide: [
                                { $subtract: ['$createdAt', '$user.createdAt'] },
                                1000 * 60 * 60 * 24,
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgDays: { $avg: '$daysDiff' },
                    },
                },
            ]),
        ]);

    const activeUsers = activeUsersResult.length;
    const repeatUsersPercentage =
        repeatUsersResult[0]?.total > 0
            ? (repeatUsersResult[0].repeat / repeatUsersResult[0].total) * 100
            : 0;
    const conversionRate = conversionResult > 0 ? (activeUsers / conversionResult) * 100 : 0;
    const abandonmentRate = 100 - conversionRate;
    const avgTimeToFirst = avgTimeResult[0]?.avgDays || 0;

    return {
        activeUsers,
        repeatUsersPercentage,
        conversionRate,
        abandonmentRate,
        avgTimeToFirst,
    };
};

const getPreviousPeriodFilter = (currentFilter: any) => {
    const currentStart = new Date(currentFilter.createdAt.$gte);
    const currentEnd = new Date(currentFilter.createdAt.$lte);
    const duration = currentEnd.getTime() - currentStart.getTime();

    return {
        $gte: new Date(currentStart.getTime() - duration),
        $lte: currentStart,
    };
};

const calculatePercentageChange = (oldValue: number, newValue: number): string => {
    if (oldValue === 0) return '+100%';
    const change = ((newValue - oldValue) / oldValue) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const calculateDaysChange = (oldValue: number, newValue: number): string => {
    const change = newValue - oldValue;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)} days`;
};

// New Users This Week
const getNewUsersThisWeek = async (matchQuery: any) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newUsers = await User.aggregate([
        {
            $match: {
                ...matchQuery,
                createdAt: { $gte: weekAgo },
            },
        },
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'userId',
                as: 'orders',
            },
        },
        {
            $project: {
                name: 1,
                entries: { $size: '$orders' },
                spend: { $sum: '$orders.totalAmount' },
            },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
    ]);

    return newUsers;
};

// High Activity Users
const getHighActivityUsers = async (matchQuery: any) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const highActivityUsers = await Order.aggregate([
        {
            $match: {
                ...matchQuery,
                createdAt: { $gte: weekAgo },
            },
        },
        {
            $group: {
                _id: '$userId',
                thisWeek: { $sum: 1 },
                wins: {
                    $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                user: '$user.name',
                thisWeek: 1,
                winRate: {
                    $multiply: [{ $divide: ['$wins', '$thisWeek'] }, 100],
                },
            },
        },
        { $sort: { thisWeek: -1 } },
        { $limit: 5 },
    ]);

    return highActivityUsers.map((user) => ({
        ...user,
        winRate: Number(user.winRate.toFixed(2)),
    }));
};

// Loyalty Metrics
const getLoyaltyMetrics = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: { ...matchQuery, status: 'won' } },
        {
            $group: {
                _id: null,
                totalWins: { $sum: 1 },
                totalOrders: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'orders',
                pipeline: [{ $match: matchQuery }],
                as: 'allOrders',
            },
        },
        {
            $project: {
                winRate: {
                    $multiply: [
                        { $divide: ['$totalWins', { $size: '$allOrders' }] },
                        100,
                    ],
                },
            },
        },
    ]);

    return {
        winRate: result[0]?.winRate || 0,
        change: '+0.3%',
    };
};

// Top Users by Spend
const getTopUsersBySpend = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$userId',
                spend: { $sum: '$totalAmount' },
                wins: {
                    $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                user: '$user.name',
                spend: 1,
                wins: 1,
            },
        },
        { $sort: { spend: -1 } },
        { $limit: 5 },
    ]);

    return result;
};

// Gold Streak Leaders
const getGoldStreakLeaders = async (matchQuery: any) => {
    const result = await Order.aggregate([
        { $match: { ...matchQuery, status: 'won' } },
        { $sort: { userId: 1, createdAt: 1 } },
        {
            $group: {
                _id: '$userId',
                orders: { $push: '$$ROOT' },
            },
        },
        {
            $project: {
                userId: '$_id',
                currentStreak: {
                    $reduce: {
                        input: '$orders',
                        initialValue: { streak: 0, maxStreak: 0 },
                        in: {
                            streak: { $add: ['$$value.streak', 1] },
                            maxStreak: {
                                $max: [
                                    '$$value.maxStreak',
                                    { $add: ['$$value.streak', 1] },
                                ],
                            },
                        },
                    },
                },
                totalWins: { $size: '$orders' },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                user: '$user.name',
                streak: '$currentStreak.maxStreak',
                wins: '$totalWins',
            },
        },
        { $sort: { streak: -1 } },
        { $limit: 5 },
    ]);

    return result;
};

// Cold Streak Users
const getColdStreakUsers = async (orderMatchQuery: any, userMatchQuery: any) => {
    const result = await Order.aggregate([
        { $match: { ...orderMatchQuery, status: 'lost' } },
        { $sort: { userId: 1, createdAt: 1 } },
        {
            $group: {
                _id: '$userId',
                orders: { $push: '$$ROOT' },
                totalSpend: { $sum: '$totalAmount' },
            },
        },
        {
            $project: {
                userId: '$_id',
                currentStreak: {
                    $reduce: {
                        input: '$orders',
                        initialValue: { streak: 0, maxStreak: 0 },
                        in: {
                            streak: { $add: ['$$value.streak', 1] },
                            maxStreak: {
                                $max: [
                                    '$$value.maxStreak',
                                    { $add: ['$$value.streak', 1] },
                                ],
                            },
                        },
                    },
                },
                spend: '$totalSpend',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                user: '$user.name',
                streak: '$currentStreak.maxStreak',
                spend: 1,
            },
        },
        { $sort: { streak: -1 } },
        { $limit: 5 },
    ]);

    return result;
};

// Geographic Distribution
const getGeographicDistribution = async (
    orderMatchQuery: any,
    userMatchQuery: any
) => {
    const [userDistribution, revenueDistribution] = await Promise.all([
        User.aggregate([
            { $match: userMatchQuery },
            {
                $group: {
                    _id: '$state',
                    users: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'orders',
                    let: { state: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$state', '$$state'] },
                                ...orderMatchQuery,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                revenue: { $sum: '$totalAmount' },
                            },
                        },
                    ],
                    as: 'orderData',
                },
            },
            {
                $project: {
                    region: '$_id',
                    users: 1,
                    revenue: {
                        $ifNull: [{ $arrayElemAt: ['$orderData.revenue', 0] }, 0],
                    },
                    avgPerUser: {
                        $divide: [
                            {
                                $ifNull: [
                                    { $arrayElemAt: ['$orderData.revenue', 0] },
                                    0,
                                ],
                            },
                            '$users',
                        ],
                    },
                    _id: 0,
                },
            },
            { $sort: { revenue: -1 } },
        ]),
        Order.aggregate([
            { $match: orderMatchQuery },
            {
                $group: {
                    _id: '$state',
                    revenue: { $sum: '$totalAmount' },
                },
            },
            {
                $project: {
                    region: '$_id',
                    revenue: 1,
                    _id: 0,
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
        ]),
    ]);

    return {
        userDistribution,
        topRevenueByRegion: revenueDistribution,
    };
};

export const DashboardService = {
    getAnalytics,
};