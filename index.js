import nodemailer from "nodemailer";
import fetch from "node-fetch";
import express from "express";
import axios from "axios";
import mails from "./mails.js";
import DiscordJs, { MessageEmbed } from "discord.js";
let threeMinuteChannelId = [];
let fiveMinuteChannelId = [];
let tenMinuteChannelId = [];
let thirtyMinuteChannelId = [];

const app = express();

const dBot = new DiscordJs.Client({
  intents: [
    DiscordJs.Intents.FLAGS.GUILDS,
    DiscordJs.Intents.FLAGS.GUILD_MESSAGES,
  ],
});

dBot.login("OTYyMDA3ODY0OTc5ODgxOTk0.YlBRpA.vJ5rZkXeKooe3z26XQTfmEXNuuY");

dBot.on("messageCreate", (msg) => {
  if (msg.content === "!create trade channels") {
    threeMinuteChannelId.push(
      msg.guild.channels.cache.find((c) => c.name === "three-minute-channel").id
    );
    fiveMinuteChannelId.push(
      msg.guild.channels.cache.find((c) => c.name === "five-minute-channel").id
    );
    tenMinuteChannelId.push(
      msg.guild.channels.cache.find((c) => c.name === "ten-minute-channel").id
    );
    thirtyMinuteChannelId.push(
      msg.guild.channels.cache.find((c) => c.name === "thirty-minute-channel")
        .id
    );
    if (!msg.guild.channels.cache.find((c) => c.name === "test")?.id) {
      msg.guild.channels.create("test", {
        type: "text",
        permissionOverwrites: [
          {
            id: msg.guild.id,
            allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
          },
        ],
      });
    }
  }
});

// const bot = new Eris(
//   "OTYyMDA3ODY0OTc5ODgxOTk0.YlBRpA.vJ5rZkXeKooe3z26XQTfmEXNuuY"
// );

// bot.on("messageCreate", (msg) => {
//   if (msg.content === "!three-minute-channel") {
//     threeMinuteChannelId = msg.channel.id;
//     bot.createMessage(threeMinuteChannelId, "GET Ready");
//   }
//   if (msg.content === "!five-minute-channel") {
//     fiveMinuteChannelId = msg.channel.id;
//     bot.createMessage(fiveMinuteChannelId, "GET Ready");
//   }
//   if (msg.content === "!ten-minute-channel") {
//     tenMinuteChannelId = msg.channel.id;
//     bot.createMessage(tenMinuteChannelId, "GET Ready");
//   }
//   if (msg.content === "!thirty-minute-channel") {
//     thirtyMinuteChannelId = msg.channel.id;
//     bot.createMessage(thirtyMinuteChannelId, "GET Ready");
//   }
// });

// bot.on("ready", () => {
//   // When the bot is ready
//   console.log("Ready!"); // Log "Ready!"
//   console.log(bot.guild);
// });

// bot.connect();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LISTENIING ON PORT ${PORT}`);
});

//#region variables
const sol = 1000000000;
const collectMints = [];
const totalNumberOfIntervals = [];
const threeMinuteIntervals = [];
const fiveMinuteIntervals = [];
const tenMinuteIntervals = [];
const thirtyMinuteIntervals = [];
const removedTimeIntervals = [];
const trades = new Map();
const timeInterval = 30000; // TODO change this back to 1 min
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
const collectionNotFound = "collection not found";
const collectionSizeCannotBeFound =
  "Collection Size cannot be found in the archives";
const listingPercentCannotBeFound = "Listing Percentage Cannout be Found";
let count = 0;
//#endregion variables

//#region api
// call api intervals
const processInterval = setInterval(() => {
  console.log(`count is ${count}`);
  count++;
  console.log(`count is ${count}`);
  fetch("https://api.solscan.io/nft/market/trade?offset=0&limit=30") // TODO change this to 50
    .then((response) => response.json())
    .then((result) => processTradingData(result));
}, timeInterval);

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
const checkForHighVolume = async (trades, numberOfRecords) => {
  // create a new one minute interval.
  let oneMinuteIntervals = [];

  // go through each collection and create the one minute interval
  for (let key of trades.keys()) {
    oneMinuteIntervals = _createOneMinuteIntervals(key, oneMinuteIntervals);
  }

  // sort to get the highest traded nft
  oneMinuteIntervals.sort((a, b) => b.size - a.size);

  const validOneMinuteIntervals = oneMinuteIntervals.filter(
    (x) => x.collectionName !== undefined
  );
  // after sorting perform the magic eden related stuff
  // const oneMinuteDataWithMagicEden = await contactMagicEden(
  //   validOneMinuteIntervals
  // );

  // add the current one minute interval data to another collection.
  insertIntoDifferentTimeIntervals(validOneMinuteIntervals);

  createTimeIntervals(3, threeMinuteResult);
  createTimeIntervals(5, fiveMinuteResult);
  createTimeIntervals(10, tenMinuteResult);
  createTimeIntervals(30, thirtyMinuteResult);
  console.log(
    "--------------------------------------------THE END -------------------------------------"
  );
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

/**
 * maps the time setting to interval array
 * @param {*} timeSetting
 * @param {*} resultArray
 */
const createTimeIntervals = (timeSetting, resultArray) => {
  const intervalArray = intervalMap[timeSetting];

  if (!intervalArray) {
    alert("wrong time setting Please check");
  }

  // generate user selected trade information
  generateUserBasedIntervals(timeSetting, intervalArray, resultArray);
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

  // go throught trade detail and calculate whatever is needed. // TODO check if lowest price is working correctly.
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

  // TODO precision is not working correctly.
  return {
    collectionName: key,
    size: numberOfNftsSold,
    mint: mints[0],
    lowestPrice: lowestPrice.toPrecision(2),
    highestPrice: highestPrice.toPrecision(2),
    averagePrice: averagePrice,
  };
}

/**
 * method is the entry point in contacting magic eden apis
 * @param {*} oneMinuteData
 * @returns
 */
const contactMagicEden = async (element) => {
  console.log("element");
  console.log(element);
  const data = await helperForContact(element); // TODO when working with apis use a try catch to catch any potential errors
  return data;
};

/**
 * helper method in contacting magic eden
 * @param {} element
 * @returns
 */
const helperForContact = async (element) => {
  try {
    var options = {
      method: "GET",
      url: `https://api-mainnet.magiceden.dev/v2/tokens/${element.mint}`,
      headers: {},
    };

    console.log(`https://api-mainnet.magiceden.dev/v2/tokens/${element.mint}`);
    const result = await axios(options);
    const data = result.data;
    const magicEdenCollection = data.collection;
    const statsResults = await getCollectionStats(magicEdenCollection);

    if (statsResults) {
      const statsData = processCollectionStats(statsResults);
      element.magicEdenLink = `https://magiceden.io/marketplace/${magicEdenCollection}`;
      // TODO find out why the undefined is coming from (which api call ) check if all the collection names are coming properly
      element.floorPrice = statsData.floorPrice;
      element.totalSupply = statsData.totalSupply;
      element.listingCount = statsData.listingCount;
      element.listingPercent = statsData.listingPercent;
      return element;
    }

    return element;
  } catch (err) {
    console.log("Error");
    console.log(err.statusCode);
    console.log(`https://api-mainnet.magiceden.dev/v2/tokens/${element?.mint}`);
    // processInterval;
    sendErrorEmail();
  }
};

/**
 * get nft collection stats - listing fp etc
 * @param {*} collection
 * @returns
 */
const getCollectionStats = async (collection) => {
  // TODO try to handle undefined in better ways
  if (collection === undefined) {
    return null;
  }
  var options = {
    method: "GET",
    url: `https://api-mainnet.magiceden.dev/v2/collections/${collection}`,
  };
  const results = await axios(options);
  return results.data;
};

/**
 * process the collections stats to retrive useful information
 * @param {} data
 * @returns
 */
const processCollectionStats = (data) => {
  if (data === collectionNotFound) {
    return undefined;
  }
  const desc = data.description.split(" ");
  const removeCommasDesc = desc.map((d) => d.replace(",", ""));
  const collectionSize = removeCommasDesc.filter(
    (d) => d !== "" && !isNaN(Number(d))
  );
  const totalSupply =
    collectionSize.length > 0 ? collectionSize[0] : collectionSizeCannotBeFound;

  const listingCount = data.listedCount;
  const listingPercent =
    totalSupply !== collectionSizeCannotBeFound
      ? `${(listingCount / totalSupply) * 100}%`
      : listingPercentCannotBeFound;
  const floorPrice = data.floorPrice / sol;

  return {
    collection: data.symbol,
    floorPrice: floorPrice,
    totalSupply: totalSupply,
    listingCount: listingCount,
    listingPercent: listingPercent,
  };
};

/**
 * generate User based Intervals
 * @param {*} timeSetting
 * @param {*} totalArray
 * @param {*} resultArray
 * @returns
 */
const generateUserBasedIntervals = (timeSetting, totalArray, resultArray) => {
  //console.log(`count is ${count} in generateUserBasedIntervals`);
  if (totalArray.length < timeSetting) {
    return;
  }

  const dataToCombine = totalArray.slice(0, timeSetting);
  combineData(dataToCombine, resultArray, timeSetting);

  const removeTimeInterval = totalArray.shift();
  removedTimeIntervals.push(removeTimeInterval);
};

/**
 * combine intervals data into one time interval data
 * @param {*} dataToCombine
 * @param {*} resultArray
 * @param {*} timeSetting
 */
const combineData = async (dataToCombine, resultArray, timeSetting) => {
  resultArray = [];
  const mergedArray = [];
  dataToCombine.forEach((d) => {
    mergedArray.push(...d);
  });

  const organizedSet = new Set(mergedArray.map((m) => m.collectionName));

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

  const winner = resultArray.shift();

  console.log(`count is ${count} and time setting is ${timeSetting}`);
  console.log(resultArray);
  console.log("winner");
  console.log(winner);
  const withMeData = await contactMagicEden(winner);
  console.log("withMeData");
  console.log(withMeData);

  if (count % 3 === 0 && timeSetting === 3) {
    const embed = createMessage(withMeData, timeSetting);
    threeMinuteChannelId.forEach((x) => {
      // dBot.channels.cache.get(x).send(meData.msg);
      dBot.channels.cache.get(x).send({ embeds: [embed] });
    });

    //dBot.createMessage(threeMinuteChannelId, meData);
  }

  if (count % 5 === 0 && timeSetting === 5) {
    const embed = createMessage(withMeData, timeSetting);
    fiveMinuteChannelId.forEach((x) => {
      dBot.channels.cache.get(x).send({ embeds: [embed] });
      //dBot.channels.cache.get(x).send({ embed: [meData.embed] });
    });
  }

  if (count % 10 === 0 && timeSetting === 10) {
    const embed = createMessage(withMeData, timeSetting);
    tenMinuteChannelId.forEach((x) => {
      dBot.channels.cache.get(x).send({ embeds: [embed] });
      //dBot.channels.cache.get(x).send({ embed: [meData.embed] });
    });
  }

  if (count % 30 === 0 && timeSetting === 30) {
    const embed = createMessage(withMeData, timeSetting);
    thirtyMinuteChannelId.forEach((x) => {
      dBot.channels.cache.get(x).send({ embeds: [embed] });
      //dBot.channels.cache.get(x).send({ embed: [meData.embed] });
    });
  }

  if (
    (count % 10 === 0 && timeSetting === 10) ||
    (count % 30 === 0 && timeSetting === 30)
  ) {
    sendEmail(timeSetting, withMeData);
  }
};

const createMessage = (withMeData, timeSetting) => {
  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`Highest Volume Traded Nft in ${timeSetting} mins`)
    .addField(
      withMeData?.collectionName,
      `Sales : ${withMeData?.size}
    Floor Price : ${withMeData?.floorPrice}`,
      false
    )
    .setURL(withMeData?.magicEdenLink);

  return embed;
};

/**
 * merge the organized data
 * @param {*} organizedCollection
 * @returns
 */
const mergeOrganizedData = (organizedCollection) => {
  let collectionName = "";
  let numberOfNftsSold = 0;
  let averagePrice = 0;
  let low = 100000;
  let high = 0;
  let mint = "";
  let magicEdenLink = "";
  let floorPrice = "";
  let totalSupply = "";
  let listingCount = "";
  let listingPercent = "";
  for (let i = 0; i < organizedCollection.length; i++) {
    // calculate number of nfts sold
    collectionName = organizedCollection[i].collectionName;
    numberOfNftsSold += organizedCollection[i].size;
    averagePrice += organizedCollection[i].averagePrice;
    mint = organizedCollection[i].mint;
    if (organizedCollection[i].lowestPrice < low) {
      low = organizedCollection[i].lowestPrice;
    }

    if (organizedCollection[i].highestPrice > high) {
      high = organizedCollection[i].highestPrice;
    }
  }

  const og = organizedCollection.filter((o) => o.magicEdenLink !== undefined);
  // TODO fix the undefined error ASAP
  // magicEdenLink = og[0]?.magicEdenLink;
  // floorPrice = og[0]?.floorPrice;
  // totalSupply = og[0]?.totalSupply;
  // listingCount = og[0]?.listingCount;
  // listingPercent = og[0]?.listingPercent;

  const combinedResult = {
    collectionName: collectionName,
    size: numberOfNftsSold,
    lowestPrice: low,
    highestPrice: high,
    averagePrice: averagePrice / organizedCollection.length,
    mint,
  };

  return combinedResult;
};

//#endregion api processing

//#region email stuff

/**
 * sending emails
 * @param {*} timeInterval
 * @param {*} winner
 */
async function sendEmail(timeInterval, winner) {
  console.log(`count is ${count} time to send a email`);
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
    to: mails,
    subject: `Top traded NFT's in ${timeInterval} minutes`,
    text: `${winner.collectionName} was sold ${winner.size} times , 
            magic edens link is : ${winner.magicEdenLink}
            floor price is : ${winner.floorPrice}
            total supply : ${winner.totalSupply}
            listed count : ${winner.listingCount}
            listing percentage : ${winner.listingPercent}`,
  });
}

async function sendErrorEmail(timeInterval, winner) {
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
    to: mails,
    subject: `Error Server will Restart`,
    text: `there as been an a unforeseen error or solana network is really congested. the service will automatically restart. 
    Thank you for your patience`,
  });
}
//#endregion email stuff
