var utils = require('./utils');
var cfg = require('./config');

utils.readCsvToArray('./database/test.csv', function(error, transactions) {
  // fOneItems 即是表头
  var fOneItems = utils.buildFOneItems(transactions, cfg.minSupport);
  console.log(fOneItems);
  // 对于每一条事务，按照F1中的顺序重新排序，不在F1中的被删除掉。这样整个事务集合变为
  var newTransactions = utils.filterTransacrions(transactions, fOneItems);
  console.log(newTransactions);
  // 生成fpTree
  var fpTree = utils.buildFpTree(newTransactions);
  console.log(JSON.stringify(fpTree, {indent: true}));

  // 遍历表头找出各项集合
  // var subTrans = utils.findSubTransFromTree(fpTree, fOneItems[fOneItems.length - 1]);
  // console.log(subTrans);

});
