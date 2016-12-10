let fs = require('fs');
let _ = require('lodash');
let FpNode = require('./FpNode');

module.exports = {
  readCsvToArray(fileName, callback) {
    let self = this;
    fs.readFile(fileName, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }
      let transactions = self.readCSVToArray(data, ',');
      callback(null, transactions);
    });
  },
  readCSVToArray(inputString, delimiter) {
    delimiter = delimiter || ',';
    let regexp = new RegExp(("(\\" + delimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + delimiter + "\\r\\n]*))"), 'gi');
    let arrayOfRows = [
      []
    ];
    let matched;
    while (!!(matched = regexp.exec(inputString))) {
      let matchedDelimiter = matched[1];
      if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
        arrayOfRows.push([]);
      }
      let matchedValue = matched[2] ? matched[2].replace(new RegExp('""', 'g'), '"') : matched[3];
      if (matchedValue.length > 0) {
        arrayOfRows[arrayOfRows.length - 1].push(matchedValue);
      }
    }
    return arrayOfRows;
  },
  hasItem(fOneItems, item){
    let flag = false;
    for (let i = 0; i < fOneItems.length; i++) {
      let itemObj = fOneItems[i];
      if (itemObj.item === 'item') {
        flag = true;
        break;
      }
    }
    return flag;
  },
  addItemFreq(fOneItems, item) {
    let hasFind = false;
    for (let i = 0; i < fOneItems.length; i++) {
      let itemObj = fOneItems[i];
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
    let self = this;
    let fOneItems = [];
    transactions.forEach(function(row, rowIndex) {
      if (!Array.isArray(row)) {
        console.log(`buildFOneItems row Error,row: ${row},transactions: ${transactions}, `);
      }
      let rowItems = [];
      row.forEach(function(item, itemIndex) {
        // 判断此项是否已经存在，如果存在则不进行计算
        // 未计算过的才进行累加计算
        if (rowItems.indexOf(item) === -1) {
          rowItems.push(item);
          // 累加支持度
          self.addItemFreq(fOneItems, item);
        }
      });
    });
    let rowLength = transactions.length;
    // 删除小于支持度的项集
    if (!Array.isArray(fOneItems)) {
      return console.log(`buildFOneItems fOneItems Error,fOneItems: ${fOneItems}`);
    }
    let resultOneItems = [];
    fOneItems.forEach(function(oneItem, index) {
      let freqPercentage = oneItem.freq/rowLength;
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
    // 由支持度高到低排序返回／
    resultOneItems.sort(function(a, b){
      return a.freq < b.freq;
    });
    return resultOneItems;
  },
  /*
    [ [ '2', '1' ],
    [ '2' ],
    [ '2', '3' ],
    [ '2', '1' ],
    [ '1', '3' ],
    [ '2', '3' ],
    [ '1', '3' ],
    [ '2', '1', '3' ],
    [ '2', '1', '3' ] ]
  */
  filterTransacrions(transactions, fOneItems) {
    let items = _.map(fOneItems, 'item');
    let newTransactions = [];
    transactions.forEach(function(row, rowIndex){
      let newRow = [];
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
  },
  findChild(children, name, parentName) {
    if (Array.isArray(children) && children.length > 0) {
      for (var i = 0; i < children.length; i++) {
        let child = children[i];
        // 必须保证找不到父节点
        // console.log(parentName, child.getParent());
        if (name === child.getName()) {
          if (!parentName) {
            return child;
          }
          if (parentName === child.parent) {
            return child;
          }
        }
      }
    }
    return null;
  },
  buildFpTree(newTransactions) {
    if (!Array.isArray(newTransactions) || newTransactions.length === 0) {
      return false;
    }
    /*
    fptree的结构应该为大的数组结构[[],[FpNode],[FpNode, FpNode],[FpNode, FpNode]]
     */
    const self = this;
    let root = [];
    newTransactions.forEach(function(transaction, rowIndex){
      // 每一行的parent节点都是root
      // 遍历每一行生成fptree
      transaction.forEach(function(item, itemIndex){
        // 判断是否在存在，如果存在递增count
        let parentName = transaction[itemIndex - 1];
        let children = root[itemIndex] || [];
        let child = self.findChild(children, item, parentName);
        // 找到的话则递增
        if(child){
          child.countIncrement(1);
        } else {
          // 如果子节点中不存在的话则new一个子节点存放进去
          child = new FpNode({name: item, count: 1});
          // 设置child的父节点。
          child.setParent(parentName);
          children.push(child);
        }
        root[itemIndex] = children;
      });
    });
    return root;
  },
  /*
  fpTree:
  [
      [{
          "name": "2",
          "count": 7
      }, {
          "name": "1",
          "count": 2
      }],
      [{
          "name": "1",
          "count": 4,
          "parent": "2"
      }, {
          "name": "3",
          "count": 2,
          "parent": "2"
      }, {
          "name": "3",
          "count": 2,
          "parent": "1"
      }],
      [{
          "name": "3",
          "count": 2,
          "parent": "1"
      }]
  ]
  fOneItem: { item: '3', freq: 6 },
  return: [
  [ '2', '3' ],
  [ '1', '3' ],
  [ '2', '3' ],
  [ '1', '3' ],
  [ '2', '1', '3' ],
  [ '2', '1', '3' ] ]
  */
 // 从尾部开始遍历查找出所有路径
 /*
 findNodes: [
  {
    route: [],
    parentNode,
    count: 1, // 第一次找到的时候更新，其他不做更新。
  }
 ]

 return :
 [ { route: [ '2', '1', '3' ], parentNode: '2', count: 2 },
  { route: [ '2', '3' ], parentNode: '2', count: 2 },
  { route: [ '1', '3' ], parentNode: '1', count: 2 } ]
 */
  findSubTransFromTree(fpTree, fOneItem) {
    let self = this;
    let item = fOneItem.item;
    let findNodes = [];
    for (var i = fpTree.length - 1; i > 0; i--) {
      let rowNodes = fpTree[i];
      for (var j = 0; j < rowNodes.length; j++) {
        var tNode = rowNodes[j];
        // 根据findNodes中的数据查找本行更新其parentNode
        // 遍历findNodes进行更新
        findNodes.forEach(function(fNode, index) {
          // 如果父节点的名称一样，则更新此节点, parentNode等价于route[0];
          if (fNode.parentNode === tNode.name) {
            // 更新route，从头部插入数据
            fNode.route.unshift(tNode.parent);
            fNode.parentNode = tNode.parent;
          }
        });
        // 如果本行有出现item节点则在findNodes中添加新的数组
        if (tNode.name === item) {
          findNodes.push({
            route: [tNode.parent, tNode.name],
            parentNode: tNode.parent,
            count: tNode.count,
          });
        }
      }
    }
    return findNodes;
  },
  /*
  [ { route: [ '2', '1', '3' ], parentNode: '2', count: 2 },
   { route: [ '2', '3' ], parentNode: '2', count: 2 },
   { route: [ '1', '3' ], parentNode: '1', count: 2 } ]
   */
   /*
   return:
   {
    transactions: [
    [ '2', '1', '3' ],
    [ '2', '3' ],
    [ '1', '3' ]
    ]
   }
    */
  buildTransactios(findNodes) {
    let transactions = [];
    findNodes.forEach(function(fNode, index){
      for (var i = 0; i < fNode.count.length; i++) {
        transactions.push(fNode.route);
      }
    })
    return transactions;
  },
  findFreqItems(fpTree, fOneItems) {
    const self = this;
    // 遍历表头找出各项集合, 此处需要做递归处理，如果找到subTrans存在的话，继续递归
    let fItems = fOneItems.pop();
    while (fItems) {
      // 让每一项的频繁项集从fpTree中递归找出以其作为尾项的频繁项集
      var findNodes = this.findSubTransFromTree(fpTree, fItems);
      // [ { route: [ '2', '1', '3' ], parentNode: '2', count: 2 },
      //  { route: [ '2', '3' ], parentNode: '2', count: 2 },
      //  { route: [ '1', '3' ], parentNode: '1', count: 2 } ]
      while ( findNodes && findNodes.length > 0) {
        // 对subsTrans做数据处理，提取出路径，合成频繁项集，并且带有count
        // 生成内嵌的subTransactions
        var subTransactions = this.buildTransactios(findNodes);
        // 生成频繁一项集
        var subFOneItem = this.buildFOneItems(subTransactions, cfg.minSupport);
        // 生成newTranstion
        var subNewTransaction = this.filterTransacrions(subTransactions, subFOneItem);
        // 生成子fpTree
        var subFptree = this.buildFpTree(subNewTransaction);
        // 找出subsTrans
        var findNodes = this.findSubTransFromTree(fpTree, fOneItems[fOneItems.length - 1]);
        console.log("---------------message-------------");

        console.log(findNodes);
      }
    }
  }
}
