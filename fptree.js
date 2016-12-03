var utils = require('./utils');
var cfg = require('./config');

utils.readCsvToArray('./database/test.csv', function(error, transactions) {
  console.log(utils.buildFOneItems(transactions, cfg.minSupport));
});
