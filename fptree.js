let TreeNode = require('./FpNode');
let _ = require('lodash');
class FpTree {
	constructor({minSup}) {
		this.minSup = minSup;
	}
	getMinSup() {
		return this.minSup;
	}
	setMinSup(minSup) {
		this.minSup = minSup;
	}
	/**
     * 1.读入事务记录
     *
     * @param filenames
     * @return
     * @author hk
     */

    readTransData(filenames) {
    	// 从文件系统中读取文件在index文件中获取
    	let records = [];
    	return records;
    }
    /**
     * 2.构造频繁1项集
     *
     * @param transRecords
     * @return
     * @author hk
     */
    buildF1Items(transRecords) {
    	let F1 = null;
    	let len = transRecords.length;
    	let hasAddItems = [];
    	let transNodes = [];
    	if (transRecords.length > 0) {
    		F1 = [];
    		for (let i = 0; i < transRecords.length; i++) {
    			let record = transRecords[i];
    			for (let j = 0; j < record.length; j++) {
    				let item = record[j].toString();
    				// 判定是否已经添加
    				let itemIndex = hasAddItems.indexOf(item);
    				if (itemIndex < 0) {
    					let node = new TreeNode({name:item});
    					node.setCount(1);
    					transNodes.push(node);
    				} else {
    					// 如果已经添加了， 则递增
    					let itemNode = transNodes(index);
    					itemNode.countIncrement(1);
    				}
    			}
    		}
	    	// 把支持度大于（或等于）minSup的项加入到F1中
	    	for (let i = 0; i < transNodes.length; i++) {
	    		let tNode = transNodes[i];
	    		if (tNode.getCount()/len >= this.minSup) {
	    			F1.push(tNode);
	    		}
	    	}
	    	// 已降序排序
	    	_.sort(tNode, function(nodea, nodeb){
	    		return nodea.getCount() < nodeb.getCount();
	    	});
    	} else {
    		return null;
    	}
    }

    /**
     * 3建立FP树
     *
     * @param transRecords
     * @param F1
     * @return
     * @author hk
     */
    buildFPTree(transRecords, F1) {
    	let root = new TreeNode();  // 创建树的根节点
    	for (let i = 0; i < transRecords.length; i++) {
    		let transRecord = transRecords[i];
    		let record = this.sortByF1(transRecord, F1);
    		let subTreeRoot = root;
    		let tmpRoot = null;
    		if (root.getChildren()) {
    			while(record.length > 0 && tmpRoot) {
    				tmpRoot = subTreeRoot.findChild(record.shift());
    				tmpRoot.countIncrement(1);
                    subTreeRoot = tmpRoot;
    			}
    		}
    		this.addNodes(subTreeRoot, record, F1);
    	}
    	return root;
    }
    /**
     * 3.1把事务数据库中的一条记录按照F1（频繁1项集）中的顺序排序
     *
     * @param transRecord
     * @param F1
     * @return
     * @author hk
     */
    sortByF1(transRecord, F1) {
    	let sortRecord = [];
    	// 过滤掉非频繁项集并按照F1的顺序排序
    	for (let j = 0; j < F1.length; j++) {
			let tNode = F1[j];
			if (transRecord.indexOf(tNode.getName()) !== -1) {
				sortRecord.push(tNode.getName());
			}
		}
		return sortRecord;
    }
    /**
     * 3.2 把若干个节点作为指定指定节点的后代插入树中
     *
     * @param ancestor
     * @param record
     * @param F1
     * @author hk
     */
    addNodes(ancestor, record, F1) {
    	if (record && record.length > 0) {
    		while(record.length > 0) {
    			let item = record.shift();
    			let leftNode = new TreeNode({name: item});
    			leftNode.setCount(1);
                leftNode.setParent(ancestor);
                ancestor.addChild(leftNode);

                for (let i = 0; i < F1.length; i++) {
                	let fNode = F1[i];
                	while (fNode.getNextSameNode()) {
                		fNode = fNode.getNextSameNode();
                	}
                	fNode.setNextSameNode(leftNode);
                	break;
                }

                this.addNodes(leftNode, record, F1);
    		}
    	}
    }
    /**
     * 4. 从FPTree中找到所有的频繁模式
     *
     * @param root
     * @param F1
     * @return
     * @author hk
     */
    findFP(root, F1) {
    	let fp = [];
			let iter = [].concat(F1);
			// 此处优点模糊
			while (iter.length > 0) {
				let curr = iter.pop();
				// 寻找cur的条件模式基CPB，放入transRecords中
				let transRecords = [];
				let backnode = curr.getNextSameNode();
				while (backnode) {
					let counter = backnode.getCount();
					let prenodes = [];
					let parent = backnode;
					// 遍历backnode的祖先节点，放到prenodes中
					while (parent.getName()) {
						prenodes.push(parent.getName());
						parent = parent.getParent();
					}
					while (counter-- > 0) {
						transRecords.push(prenodes);
					}
					backnode = backnode.getNextSameNode();
				}
			}

			// // 生成条件频繁1项集
			let subF1 = buildF1Items(transRecords);
			// 建立条件模式基的局部FP-tree
      let subRoot = buildFPTree(transRecords, subF1);

			// 从条件FP-Tree中寻找频繁模式
			if (subRoot) {
				let prePatterns = findPrePattern(subRoot);
				if (prePatterns) {
          let ss = prePatterns.entrySet();
          for (Entry<List<String>, Integer> entry : ss) {
            entry.getKey().add(curr.getName());
            fp.put(entry.getKey(), entry.getValue());
          }
        }
			}
    }

		/**
     * 4.1 从一棵FP-Tree上找到所有的前缀模式
     *
     * @param root
     * @return
     * @author hk
     */
  	findPrePattern(root) {
			let patterns = null;
			let children = root.getChildren();
			if (children) {
				patterns = [];
				for (let i = 0; i < children.length; i++) {
					// 找到以child为根节点的子树中的所有长路径（所谓长路径指它不是其他任何路径的子路径）
					let child = children[i];
					let paths = this.buildPaths(child);
					if (paths) {
						for (let j = 0; j < paths.length; j++) {
							let path = paths[j];
							let backPatterns = this.combination(path);
						}
					}
				}
			}
		}
		/**
     * 4.1.1 找到从指定节点（root）到所有可达叶子节点的路径
     *
     * @param root
     * @return
     * @author hk
     */
    buildPaths(root) {
			let paths;
			if (root) {
				paths = [];
				let children = root.getChildren();
				if (children) {
					// 在从树上分离单条路径时，对分叉口的节点，其count也要分到各条路径上去
          // 条件FP-Tree是多枝的情况
          if(children.length > 1){
						for (let i = 0; i < children.length; i++) {
							let child = children[i];
							let count = child.getCount();
							let ll = this.buildPaths(child);
							for (let j = 0; j < ll.length; j++) {
								let lp = ll[j];
								let prenode = new TreeNode(root.getName());
								prenode.setCount(count);
								lp.addFirst(prenode);
								paths.push(lp);
							}
						}
					}else { // 条件FP-Tree是单枝的情况
						for (let k = 0; k < children.length; k++) {
							let child = children[k];
							let ll = this.buildPaths(child);
							for (let i = 0; i < ll.length; i++) {
								let lp = ll[i];
								lp.addFirst(root);
								paths.push(lp);
							}
						}
					}
				} else {
					let lp = [];
					lp.push(root);
					paths.add(lp);
				}
			}
			return paths;
		}
		/**
     * 4.1.2 生成路径path中所有元素的任意组合，并记下每一种组合的count--其实就是组合中最后一个元素的count， 因为我们的组合算法保证了树中
     *
     * @param path
     * @return
     * @author hk
     */
    combination(path) {
			if (path.length > 0) {
				// 从path中移除首节点
				let start = path.shift();
				// 首节点自己可以成为一个组合，放入rect中
				let rect = [];
				let li = [];
				li.push(start.getName());
				rect.push(li, start.getCount());
				let postCombination = this.combination(path);
				if (postCombination) {
					for (let i = 0; i < postCombination.length; i++) {
						let postCombination[i]
						// 把首节点之后元素的所有组合放入rect中
						// 首节点并上其后元素的各种组合放入rect中
					}
				}
			}
		}
}
