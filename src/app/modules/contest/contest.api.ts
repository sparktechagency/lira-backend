import axios from 'axios';
export const getCryptoPrice = async (crypto: string) => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`;
    console.log(url);
    try {
        const response = await axios.get(url);
        return response.data[crypto].usd;
    } catch (error) {
        console.error("Error fetching crypto price:", error);
        throw new Error("Could not fetch crypto price");
    }
};
export const getCryptoPriceHistory = async (crypto: string, vs_currency: string, days: number) => {
    const url = `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=${vs_currency}&days=${days}`;
    try {
        const response = await axios.get(url);
        return response.data.prices;  // This returns a list of timestamps and price values.
    } catch (error) {
        console.error("Error fetching crypto price history:", error);
        throw new Error("Could not fetch crypto price history");
    }
};
const apiKey = '8WKIZ3V3NSF7LUM2';
export const getStockPrice = async (symbol: string) => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
    try {
        const response = await axios.get(url);
        const timeSeries = response.data["Time Series (Daily)"];
        const latestDate = Object.keys(timeSeries)[0];
        return timeSeries[latestDate]["4. close"];
    } catch (error) {
        console.error(error);
    }
};

