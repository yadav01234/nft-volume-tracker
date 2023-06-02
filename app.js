import axios from "axios";
const symbols = [];
const results = [];
const getCollections = async () => {
  try {
    for (let index = 0; index < 6000; index += 500) {
      const config = {
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections?offset=${index}&limit=500`,
        headers: {},
      };
      const response = await axios(config);
      symbols.push(...response.data.map((x) => x.symbol));
    }
  } catch (err) {
    console.log(err);
  }
};

const getActivities = async () => {
  for (let i = 0; i < symbols.length; i++) {
    try {
      const config = {
        method: "get",
        url: `https://api-mainnet.magiceden.dev/v2/collections/${symbols[i]}/activities?offset=0&limit=100`,
        headers: {},
      };
      const response = await axios(config);
      const data = response.data;
      const onlyBuys = data.filter((d) => d.type === "buyNow");
      console.log(`${data[0]?.collection} is sold ${onlyBuys.length}`);
    } catch (err) {
      console.log(err);
    }
  }
};
await getCollections();
await getActivities();
