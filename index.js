// const eris = require('eris');

// // Create a Client instance with our bot token.
// const bot = new eris.Client('OTYyMDA3ODY0OTc5ODgxOTk0.YlBRpA.vJ5rZkXeKooe3z26XQTfmEXNuuY');

// // When the bot is connected and ready, log to console.
// bot.on('ready', () => {
//    console.log('Connected and ready.');
// });

// // Every time a message is sent anywhere the bot is present,
// // this event will fire and we will check if the bot was mentioned.
// // If it was, the bot will attempt to respond with "Present".
//     bot.on('messageCreate', async (msg) => {
//    const botWasMentioned = msg.mentions.find(
//        mentionedUser => mentionedUser.id === bot.user.id,
//    );

//    bot.on('messageCreate', async (msg) => {
//     const content = msg.content;

//     // Ignore any messages sent as direct messages.
//     // The bot will only accept commands issued in
//     // a guild.
//     if (!msg.channel.guild) {
//       return;
//     }

//    if (botWasMentioned) {
//        try {
//            await msg.channel.createMessage('Hey There I am trade bot.');
//        } catch (err) {
//            // There are various reasons why sending a message may fail.
//            // The API might time out or choke and return a 5xx status,
//            // or the bot may not have permission to send the
//            // message (403 status).
//            console.warn('Failed to respond to mention.');
//            console.warn(err);
//        }
//    }
// });

// bot.on('error', err => {
//    console.warn(err);
// });

// bot.connect();

const Eris = require("eris");

// Replace TOKEN with your bot account's token
const bot = new Eris.Client(
  "OTYyMDA3ODY0OTc5ODgxOTk0.YlBRpA.vJ5rZkXeKooe3z26XQTfmEXNuuY"
);

bot.on("ready", () => {
  // When the bot is ready
  console.log("Ready!"); // Log "Ready!"
});

bot.on("error", (err) => {
  console.error(err); // or your preferred logger
});

bot.on("messageCreate", (msg) => {
  // When a message is created
  if (msg.content === "!ping") {
    // If the message content is "!ping"
    bot.createMessage(msg.channel.id, "Pong!");
    // Send a message in the same channel with "Pong!"
  } else if (msg.content === "!pong") {
    // Otherwise, if the message is "!pong"
    bot.createMessage(msg.channel.id, "Ping!");
    // Respond with "Ping!"
  }
});

//bot.createChannel("940455705717116929", "10 minutes interval", "0");

bot.connect();
