let utils = require('./utils');
let cfg = require('./config');

utils.readCsvToArray('./database/test.csv', function(error, transactions) {
  // fOneItems 即是表头
  let fOneItems = utils.buildFOneItems(transactions, cfg.minSupport);
  console.log(fOneItems);
  // 对于每一条事务，按照F1中的顺序重新排序，不在F1中的被删除掉。这样整个事务集合变为
  let newTransactions = utils.filterTransacrions(transactions, fOneItems);
  console.log(newTransactions);
  // 生成fpTree
  let fpTree = utils.buildFpTree(newTransactions);
  console.log(JSON.stringify(fpTree, {indent: true}));

  // 遍历表头找出各项集合, 此处需要做递归处理，如果找到subTrans存在的话，继续递归
  for (let i = 0; i < fOneItems.length; i++) {
    let fItems = fOneItems[i];
    // 让每一项的频繁项集从fpTree中递归找出以其作为尾项的频繁项集
    var findNodes = utils.findSubTransFromTree(fpTree, fItems);
    console.log(findNodes);

    // [ { route: [ '2', '1', '3' ], parentNode: '2', count: 2 },
    //  { route: [ '2', '3' ], parentNode: '2', count: 2 },
    //  { route: [ '1', '3' ], parentNode: '1', count: 2 } ]
    while ( findNodes && findNodes.length > 0) {
      // 对subsTrans做数据处理，提取出路径，合成频繁项集，并且带有count
      // 生成内嵌的subTransactions
      var subTransactions = utils.buildTransactios(findNodes);
      // 生成频繁一项集
      var subFOneItem = utils.buildFOneItems(subTransactions, cfg.minSupport);
      // 生成newTranstion
      var subNewTransaction = utils.filterTransacrions(subTransactions, subFOneItem);
      // 生成子fpTree
      var subFptree = utils.buildFpTree(subNewTransaction);
      // 找出subsTrans
      var findNodes = utils.findSubTransFromTree(fpTree, fOneItems[fOneItems.length - 1]);
      console.log("---------------message-------------");

      console.log(findNodes);
    }
  }

});
