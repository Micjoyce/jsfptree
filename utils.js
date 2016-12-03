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
  // 找出频繁一项集合
  buildFOneItems(transactions, minSupport) {
    if (!Array.isArray(transactions)) {
      return console.log(`buildFOneItems Error, transactions: ${transactions}`);
    }
    var fOneItems = {};
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
          if (!fOneItems[item.toString()]) {
            fOneItems[item.toString()] = 1;
          } else {
            fOneItems[item.toString()] += 1;
          }
        }
      });
    });
    return fOneItems;
  }
}
