// Import the Fetch-API
const fetch = require("node-fetch");

// Database Variables
const Client = require("@replit/database");
const client = new Client();

// API variables
const base = "api.coinlayer.com";
const apiKey = process.env['apiKey'];
const target = "USD";
const symbol = "XMR";
const LOOP_DELAY = 2000;


// wrap all the code we want to run in a main() function
async function main() {

    // use this to setup initial data
    // await setupData();

    // Financial data 
    let balanceUSD = await client.get("balanceUSD");
    let balanceXMR = await client.get("balanceXMR");

    // Time data in UTC
    let rightNow;
    let hasYetToTrade = true;

    await client.getAll().then(something => console.log("getAll()", something));

    await client.list().then(keys => { console.log(keys) });

    while (true) {
        console.log("looping..");
        if (buyConditions(hasYetToTrade)) {
            console.log("It's time to trade! Three Dolla billz y'all!");
            buy({ balanceUSD, balanceXMR });
        }
        else if (skipSellConditions(hasYetToTrade)) {
            console.log("It's time to trade but I've already traded.");
        }
        else if (sellConditions()) {
            sell();
        }
        else {
            hasYetToTrade = !hasYetToTrade ? true : false;
        }

        await delay(LOOP_DELAY);
    }
}

async function setupData() {
    await client.set("balanceXMR", 0.0);
    await client.set("balanceUSD", 1000.0);
}

function buyConditions(hasYetToTrade) {
    rightNow = new Date();
    return isTimeToTrade(rightNow) && hasYetToTrade;
}

function skipSellConditions(hasYetToTrade) {
    rightNow = new Date();
    return isTimeToTrade(rightNow) && !hasYetToTrade;
}

function sellConditions() {
    return false;
}

function sell() {
    return false;
}

function setPeak(peakDate) {
    fetch(`http://${base}/${peakDate}?access_key=${apiKey}&target=${target}&symbols=${symbol}`)
        .then((res) => { return res.json() })
        .then((data) => { return data.rates.XMR })
        .then((rate) => { client.set("peak", rate) })
        .catch((err) => { console.log(`I am getting an error: ${err}`) });
}

function isTimeToTrade(rightNow) {
    let rightHour = rightNow.getHours() === 15 ||
        rightNow.getHours() === 19 ||
        rightNow.getHours() === 23;
    let rightMinute = rightNow.getMinutes() === 0;
    let rightSecond = rightNow.getSeconds() === 0;
    return rightHour && rightMinute && rightSecond;
}

async function updateXMRPrice() {
    fetch(`http://${base}/live?access_key=${apiKey}&target=${target}&symbols=${symbol}`)
        .then((res) => { return res.json() })
        .then((json) => { client.set("lastQuotedPrice", `${json.rates.XMR}`) })
        .then(() => { console.log("The Price of XMR has been updated.") })
        .catch((err) => { console.log("There was an error fetching prices.") });
}

async function buy({ balanceUSD, balanceXMR }) {
    client.get("lastQuotedPrice").then((lastQuotedPrice) => {
        let purchaseQuantity = Math.floor(balanceUSD / lastQuotedPrice * 100000) / 100000;
        let power = 0;
        console.log(`Initial USD Balance ${balanceUSD}`);
        console.log(`Price of 1 XMR: $${lastQuotedPrice} USD`);
        console.log(`Purchase Quantity: ${purchaseQuantity} XMR`);

        while (balanceUSD > 0.02 && power <= 5) {

            let qtyToBuy = Math.floor(purchaseQuantity * (Math.pow(10, power))) / Math.pow(10, power);
            balanceXMR += qtyToBuy;
            let qtyPriceUSD = Math.ceil(lastQuotedPrice * qtyToBuy * 100) / 100;
            balanceUSD -= qtyPriceUSD;
            balanceUSD = Math.floor(qtyPriceUSD * 100) / 100;
            purchaseQuantity -= qtyToBuy;

            console.log(`I am buying ${qtyToBuy} XMR for ${qtyPriceUSD} USD`);
            console.log(`New XMR Balance: ${balanceXMR}`);
            console.log(`New USD Balance: ${balanceUSD}`);
            console.log(`New Quantity to buy: ${purchaseQuantity}`);
            console.log(`Purchase Quantity precision: ${power}`);
            power++;
        }

        client.set("balanceUSD", balanceUSD);
        client.set("balanceXMR", balanceXMR);
    });
}

// util functions
async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}

// call our main function, should be only function ran by ths script
main();