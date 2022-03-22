import nodemailer from "nodemailer";
import fetch from "node-fetch";
import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LISTENIING ON PORT ${PORT}`);
});

//#region variables
const sol = 1000000000;
const totalNumberOfIntervals = [];
const threeMinuteIntervals = [];
const fiveMinuteIntervals = [];
const tenMinuteIntervals = [];
const thirtyMinuteIntervals = [];
const removedTimeIntervals = [];
const trades = new Map();
const timeInterval = 60000;
const intervalMap = {
  3: threeMinuteIntervals,
  5: fiveMinuteIntervals,
  10: tenMinuteIntervals,
  30: thirtyMinuteIntervals,
};
const threeMinuteResult = [];
const fiveMinuteResult = [];
const tenMinuteResult = [];
const thirtyMinuteResult = [];
let count = 0;
//#endregion variables

//#region api
// call api intervals
const processInterval = setInterval(() => {
  count++;
  fetch("https://api.solscan.io/nft/market/trade?offset=0&limit=50")
    .then((response) => response.json())
    .then((result) => processTradingData(result));
}, timeInterval);

const stop = () => {
  console.log("stopped");
  clearInterval(processInterval);
};

// button.addEventListener("click", stop);
//#endregion api

/**
 * this is used to process raw json data
 * @param {} result
 */
const processTradingData = (result) => {
  const data = result.data;

  for (let d of data) {
    // collection name which is stored as a key
    const collectionName = d.collection;

    // this is the trade information that is uses in processing // TODO - need to add more details
    const tradeInfo = {
      name: d.name,
      mint: d.mint,
      price: d.price / sol,
      isProcess: false,
    };

    if (trades.get(collectionName) == undefined) {
      trades.set(collectionName, [tradeInfo]);
    } else {
      const existingTrade = trades.get(collectionName);
      const isTheMintAlreadyPresent = existingTrade.some(
        (e) => e.mint === tradeInfo.mint
      );
      if (!isTheMintAlreadyPresent) {
        existingTrade.push(tradeInfo);
      }
    }
  }

  checkForHighVolume(trades);
};

/**
 * check for highVolume
 * @param {} trades
 */
const checkForHighVolume = (trades, numberOfRecords) => {
  // create a new one minute interval.
  let oneMinuteIntervals = [];

  // go through each collection and create the one minute interval
  for (let key of trades.keys()) {
    oneMinuteIntervals = _createOneMinuteIntervals(key, oneMinuteIntervals);
  }

  // sort to get the highest traded nft
  oneMinuteIntervals.sort((a, b) => b.size - a.size);

  console.log(oneMinuteIntervals);

  // add the current one minute interval data to another collection.
  insertIntoDifferentTimeIntervals(oneMinuteIntervals);

  createTimeIntervals(3, threeMinuteResult);
  createTimeIntervals(5, fiveMinuteResult);
  createTimeIntervals(10, tenMinuteResult);
  createTimeIntervals(30, thirtyMinuteResult);
};

/**
 * inserts one minute data into different intervals.
 * @param {one minute data intervals which holds trade data for each minute} oneMinuteData
 */
const insertIntoDifferentTimeIntervals = (oneMinuteData) => {
  totalNumberOfIntervals.push(oneMinuteData);
  threeMinuteIntervals.push(oneMinuteData);
  fiveMinuteIntervals.push(oneMinuteData);
  tenMinuteIntervals.push(oneMinuteData);
  thirtyMinuteIntervals.push(oneMinuteData);
};

const createTimeIntervals = (timeSetting, resultArray) => {
  const intervalArray = intervalMap[timeSetting];

  if (!intervalArray) {
    alert("wrong time setting Please check");
  }

  generateUserBasedIntervals(timeSetting, intervalArray, resultArray);
};

/**
 * finds the top 3 winners
 * @param {holds the data of each minute traded} totalNumberOfIntervals
 */
const winners = (totalNumberOfIntervals, numberOfRecords) => {
  return totalNumberOfIntervals.map((oneMinuteData) =>
    oneMinuteData.slice(0, numberOfRecords)
  ); // todo use a slice here later.
};

/**
 * creates one minute intervals of trade information
 * @param {*} key
 * @returns
 */
function _createOneMinuteIntervals(key, oneMinuteIntervals) {
  const tradeDetail = trades.get(key);

  // create the object which would go into one minutes array
  const tradeInformation = _generateOneMinuteIntervalTradeInfo(
    tradeDetail,
    key
  );

  if (tradeInformation) {
    oneMinuteIntervals.push(tradeInformation);
  }

  return oneMinuteIntervals;
}

/**
 * creates the actual information needed.
 * @param {*} tradeDetail
 * @param {*} key
 * @returns
 */
function _generateOneMinuteIntervalTradeInfo(tradeDetail, key) {
  // define the variables
  let lowestPrice = 0;
  let highestPrice = 0;
  let totalPrice = 0;

  const newTrades = tradeDetail.filter((t) => !t.isProcess);

  // no new trades have taken place.
  if (newTrades.length === 0) {
    return;
  }

  const numberOfNftsSold = newTrades.length;

  // go throught trade detail and calculate whatever is needed.
  for (let t of newTrades) {
    if (t.price > highestPrice) highestPrice = t.price;
    if (lowestPrice < t.price) lowestPrice = t.price;
    totalPrice += t.price;
  }

  const averagePrice = totalPrice / numberOfNftsSold;

  const mints = newTrades.map((t) => t.mint);

  tradeDetail.forEach((x) => {
    x.isProcess = true;
  });

  return {
    collectionName: key,
    size: numberOfNftsSold,
    // mint: mints[0],
    lowestPrice: lowestPrice.toPrecision(2),
    highestPrice: highestPrice.toPrecision(2),
    averagePrice: averagePrice,
  };
}

const generateUserBasedIntervals = (timeSetting, totalArray, resultArray) => {
  if (totalArray.length < timeSetting) {
    return;
  }

  const dataToCombine = totalArray.slice(0, timeSetting);
  console.log(dataToCombine);
  combineData(dataToCombine, resultArray, timeSetting);

  const removeTimeInterval = totalArray.shift();
  removedTimeIntervals.push(removeTimeInterval);
};

/** combines the interval data */
const combineData = (dataToCombine, resultArray, timeSetting) => {
  resultArray = [];
  const mergedArray = [];
  dataToCombine.forEach((d) => {
    mergedArray.push(...d);
  });

  const organizedSet = new Set(mergedArray.map((m) => m.collectionName));
  console.log(organizedSet);

  const organizedCollections = [];
  organizedSet.forEach((m) => {
    if (m) {
      organizedCollections.push(
        mergedArray.filter((f) => f.collectionName === m)
      );
    }
  });

  organizedCollections.forEach((x) => {
    if (x.length > 1) {
      const y = mergeOrganizedData(x);
      resultArray.push(y);
    } else {
      resultArray.push(x.shift());
    }
  });

  resultArray.sort((a, b) => b.size - a.size);
  console.log("final result");
  console.log(resultArray);
  //   if (timeSetting === 3) {
  //     createRow(resultArray.slice(0, 5), table1);
  //   } else if (timeSetting === 5) {
  //     createRow(resultArray.slice(0, 5), table2);
  //   } else if (timeSetting === 10) {
  //     createRow(resultArray.slice(0, 5), table3);
  //   } else {
  //     createRow(resultArray.slice(0, 5), table4);
  //   }

  const winner = resultArray.shift();
  console.log("winner");
  console.log(winner);
  console.log("count is " + count);
  if (
    (count % 10 === 0 && timeSetting === 10) ||
    (count % 30 === 0 && timeSetting === 30)
  ) {
    console.log('mails');
    sendEmail(timeSetting, winner.collectionName, winner.size);
  }
};

const mergeOrganizedData = (organizedCollection) => {
  let collectionName = "";
  let numberOfNftsSold = 0;
  let averagePrice = 0;
  let low = 100000;
  let high = 0;
  for (let i = 0; i < organizedCollection.length; i++) {
    console.log(organizedCollection[i]);
    // calculate number of nfts sold
    collectionName = organizedCollection[i].collectionName;
    numberOfNftsSold += organizedCollection[i].size;
    averagePrice += organizedCollection[i].averagePrice;
    if (organizedCollection[i].lowestPrice < low) {
      low = organizedCollection[i].lowestPrice;
    }

    if (organizedCollection[i].highestPrice > high) {
      high = organizedCollection[i].highestPrice;
    }
  }

  const combinedResult = {
    collectionName: collectionName,
    size: numberOfNftsSold,
    lowestPrice: low,
    highestPrice: high,
    averagePrice: averagePrice / organizedCollection.length,
  };

  console.log(combinedResult);

  return combinedResult;
};

//#endregion api processing

//#region email stuff

async function sendEmail(timeInterval, nft, size) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: "rakshithyadavmi6@gmail.com",
      pass: "mffpewkksggbobjx",
    },
  });

  // send email
  await transporter.sendMail({
    from: "rakshithyadavmi6@gmail.com",
    to: ["rakshithyadavmi6@gmail.com"],
    subject: `Top traded NFT's in ${timeInterval} minutes`,
    text: `${nft} was sold ${size} times`,
  });
}
//#endregion email stuff
