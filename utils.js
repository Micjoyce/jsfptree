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
  buildFpTree(newTransactions) {
    if (!Array.isArray(newTransactions) || newTransactions.length === 0) {
      return false;
    }
    /*
    fptree的结构应该为大的数组结构[[],[FpNode],[FpNode, FpNode],[FpNode, FpNode]]
     */
    let root = new FpNode({name: 'root'});
    newTransactions.forEach(function(transaction, rowIndex){
      // 每一行的parent节点都是root
      let parent = root;
      // 遍历每一行生成fptree
      transaction.forEach(function(item, itemIndex){
        // 判断是否在存在，如果存在递增count
        let child = parent.findChild(item);
        if(child){
          // 找到的话则递增
          child.countIncrement(1);
        } else {
          // 如果子节点中不存在的话则new一个子节点存放进去
          child = new FpNode({name: item, count: 1});
          parent.addChild(child);
        }
        // 设置parent
        parent = child;
      });
    });
    return root;
  },
  /*
  fpTree:
  {
      "name": "root",
      "children": [{
          "name": "2",
          "count": 7,
          "children": [{
              "name": "1",
              "count": 4,
              "children": [{
                  "name": "3",
                  "count": 2
              }]
          }, {
              "name": "3",
              "count": 2
          }]
      }, {
          "name": "1",
          "count": 2,
          "children": [{
              "name": "3",
              "count": 2
          }]
      }]
  }
  fOneItem: { item: '3', freq: 6 },
  return: [
  [ '2', '3' ],
  [ '1', '3' ],
  [ '2', '3' ],
  [ '1', '3' ],
  [ '2', '1', '3' ],
  [ '2', '1', '3' ] ]
  */
  findSubTransFromTree(fpTree, fOneItem) {
    let self = this;
    let item = fOneItem.item;
    let children = fpTree.getChildren();
    let prePath = [];
    while (children) {
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let childName = child.getName();
        // 如果此节点的名称找到了则不进行递归，添加此节点
        if (childName === item) {
          prePath.push(childName)
          // 如果找到此节点则找到其路径
        } else {
          prePath.push(child.getName())
          self.findSubTransFromTree(child, fOneItem);
          children = child;
        }
      }
    }
    return prePath;
  },
  buildPath(child) {
    let parent = child.getParent();
    let path = [child.getName()];
    while (parent && parent.getName() !== 'root') {
      path.unshift(parent.getName());
      parent = parent.getParent();
    }
    return path;
  }
}
