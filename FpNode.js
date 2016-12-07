class FpNode {
	constructor({name, count, parent, children}) {
		this.name = name;  // 节点名称
		this.count = count; // 计数
		this.parent = parent; // 父节点
		this.children = children; // 子节点
		this.nextSameNode;  // 下一个同名节点
	}

	countIncrement(n){
		n = n || 1;
		this.count +=n;
	}
	getName() {
		return this.name;
	}
	setName(name) {
		this.name = name;
	}
	getCount() {
		return this.count;
	}
	setCount(count) {
		this.count = count;
	}
	getParent() {
		this.parent;
	}
	// 设置父节点
	setParent(parent) {
		this.parent = parent;
	}
	getChildren() {
		return this.children;
	}
	setChildren(children) {
		this.children = children;
	}
	getNextSameNode() {
		return this.nextSameNode;
	}
	compareTo(treeNode) {
		var count0 = treeNode.getCount();
		return count0 - this.count;
	}
	/**
     * 添加一个子节点
     * @param child
     * @author hk
     */
	addChild(child) {
		if (!Array.isArray(this.children)) {
			return this.children = [child];
		}
		// 添加前需要做一个判断是否已经添加过了
		for (let i = this.children.length - 1; i >= 0; i--) {
			let itemChild = this.children[i];
			if (itemChild.getName() === child.getName()) {
				return console.log(`Had ad
					d child, ${this.name} has add ${child}, children: ${this.children}`);
			}
		}
		this.children.push(child);
	}
    
    /**
     * 查找一个子节点
     * @param name
     * @return 
     * @author hk
     */

	findChild(name) {
		let children = this.getChildren();
		if (Array.isArray(children) || children.length > 0) {
			for (var i = 0; i < children.length; i++) {
				let child = children[i];
				if (name === child.getName()) {
					return child;
				}
			}
		}
		return null;
	}
	/**
     * 打印节点
     * 
     * @author hk
     */
    printChildrenName() {
    	let children = this.getChildren();
    	if (Array.isArray(children) || children.length > 0) {
    		for (var i = 0; i < children.length; i++) {
    			console.log(`printChildrenName childName: ${children[i].getName()}`)
    		}
    	} else {
    		console.log(`printChildrenName childName: none`)
    	}

    }

}

module.exports = FpNode;
