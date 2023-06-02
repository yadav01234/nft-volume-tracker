const discord = require("discord.js");
const client = new discord.Client();

client.on("ready", () => {
  console.log("client is ready");
});

client.login("OTYyMDA3ODY0OTc5ODgxOTk0.YlBRpA.vJ5rZkXeKooe3z26XQTfmEXNuuY");
