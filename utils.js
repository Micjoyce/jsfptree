var fs = require('fs');
var _ = require('lodash');

module.exports = {
  readCsvToArray(fileName, callback) {
    var self = this;
    fs.readFile(fileName, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }
      var transactions = self.readCSVToArray(data, ',');
      callback(null, transactions);
    });
  },
  readCSVToArray(inputString, delimiter) {
    delimiter = delimiter || ',';
    var regexp = new RegExp(("(\\" + delimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + delimiter + "\\r\\n]*))"), 'gi');
    var arrayOfRows = [
      []
    ];
    var matched;
    while (!!(matched = regexp.exec(inputString))) {
      var matchedDelimiter = matched[1];
      if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
        arrayOfRows.push([]);
      }
      var matchedValue = matched[2] ? matched[2].replace(new RegExp('""', 'g'), '"') : matched[3];
      if (matchedValue.length > 0) {
        arrayOfRows[arrayOfRows.length - 1].push(matchedValue);
      }
    }
    return arrayOfRows;
  },
  hasItem(fOneItems, item){
    var flag = false;
    for (var i = 0; i < fOneItems.length; i++) {
      var itemObj = fOneItems[i];
      if (itemObj.item === 'item') {
        flag = true;
        break;
      }
    }
    return flag;
  },
  addItemFreq(fOneItems, item) {
    var hasFind = false;
    for (var i = 0; i < fOneItems.length; i++) {
      var itemObj = fOneItems[i];
      if (itemObj.item === item) {
        hasFind = true;
        itemObj.freq += 1;
        break;
      }
    }
    // 未找到
    if (hasFind === false) {
      fOneItems.push({
        item: item,
        freq: 1,
      })
    }
    return fOneItems;
  },
  // 找出频繁一项集合
  buildFOneItems(transactions, minSupport) {
    if (!Array.isArray(transactions)) {
      return console.log(`buildFOneItems Error, transactions: ${transactions}`);
    }
    var self = this;
    var fOneItems = [];
    transactions.forEach(function(row, rowIndex) {
      if (!Array.isArray(row)) {
        console.log(`buildFOneItems row Error,row: ${row},transactions: ${transactions}, `);
      }
      var rowItems = [];
      row.forEach(function(item, itemIndex) {
        // 判断此项是否已经存在，如果存在则不进行计算
        // 为计算过的才进行累加计算
        if (rowItems.indexOf(item) === -1) {
          rowItems.push(item);
          // 累加支持度
          self.addItemFreq(fOneItems, item);
        }
      });
    });
    var rowLength = transactions.length;
    // 删除小于支持度的项集
    if (!Array.isArray(fOneItems)) {
      return console.log(`buildFOneItems fOneItems Error,fOneItems: ${fOneItems}`);
    }
    var resultOneItems = [];
    fOneItems.forEach(function(oneItem, index) {
      var freqPercentage = oneItem.freq/rowLength;
      if (freqPercentage >= minSupport) {
        resultOneItems.push({
          item: oneItem.item,
          freq: oneItem.freq,
        });
      }
    });
    /*
    [ { item: '2', freq: 7 },
      { item: '1', freq: 6 },
      { item: '3', freq: 6 },
      { item: '4', freq: 2 },
      { item: '5', freq: 2 } ]
    */
    // 由支持度高到低排序返回
    resultOneItems.sort(function(a, b){
      return a.freq < b.freq;
    });
    return resultOneItems;
  },
  filterTransacrions(transactions, fOneItems) {
    var items = _.map(fOneItems, 'item');
    var newTransactions = [];
    transactions.forEach(function(row, rowIndex){
      var newRow = [];
      items.forEach(function(item, index) {
        // 如果频繁项集在此行中出现则将其push到新的数组中
        if (row.indexOf(item) !== -1) {
          newRow.push(item);
        }
      });
      if (newRow.length > 0) {
        newTransactions.push(newRow);
      }
    });
    return newTransactions;
  }
}
