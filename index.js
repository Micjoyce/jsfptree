var utils = require('./utils');
var cfg = require('./config');

utils.readCsvToArray('./database/test.csv', function(error, transactions) {
  // fOneItems 即是表头
  var fOneItems = utils.buildFOneItems(transactions, cfg.minSupport);
  // 对于每一条事务，按照F1中的顺序重新排序，不在F1中的被删除掉。这样整个事务集合变为
  var newTransactions = utils.filterTransacrions(transactions, fOneItems);
  // 声称fptree
  var fpTree = utils.buildFpTree(newTransactions);

});