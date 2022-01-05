// Import the Fetch-API
const fetch = require("node-fetch");

// Database Variables
const Database = require("@replit/database");
const db = new Database();

// API variables
const base = "api.coinlayer.com";
const apiKey = process.env['apiKey'];
const target = "USD";
const symbol = "XMR";

// Financial data 
let balanceUSD = 1000.00;
let balanceXMR = 0.0;

// Time data in UTC
let rightNow;

while(true){

    rightNow = new Date();

    if ( isTimeToTrade(rightNow) ) {
        console.log("It's time to trade! Dolla billz y'all!");
    } else {
        console.log("It's not time to trade yet.");
    }

}


function setPeak( peakDate ) {
    fetch(`http://${base}/${peakDate}?access_key=${apiKey}&target=${target}&symbols=${symbol}`)
        .then( (res) => { return res.json() } )
        .then( (data) => { return data.rates.XMR } )
        .then( (rate) => { db.set("peak", rate) } )
        .catch( (err) => { console.log(`I am getting an error: ${err}`) } );
}

function isTimeToTrade( rightNow ) {
    let rightHour = rightNow.getHours() === 15 || rightNow.getHours() === 19 || rightNow.getHours() === 23;
    let rightMinute = rightNow.getMinutes() === 0;
    let rightSecond = rightNow.getSeconds() === 0;
    return rightHour && rightMinute && rightSecond;
}