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
    const oneMinuteDataWithMagicEden = await contactMagicEden(
      validOneMinuteIntervals
    );
  
    // add the current one minute interval data to another collection.
    insertIntoDifferentTimeIntervals(oneMinuteDataWithMagicEden);
  
    createTimeIntervals(3, threeMinuteResult);
    createTimeIntervals(5, fiveMinuteResult);
    createTimeIntervals(10, tenMinuteResult);
    createTimeIntervals(30, thirtyMinuteResult);
  };