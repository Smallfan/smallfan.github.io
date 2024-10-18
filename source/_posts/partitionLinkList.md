---
title: 分隔链表（LeetCode No.86）
date: 2022-11-03 20:40:11
tags: ['算法', '数据结构', '链表' ]
categories:
- 技术
- 数据结构算法
cover: https://blogpic.smallfan.top/alg/partitionLinkList.png
---

![](https://blogpic.smallfan.top/alg/partitionLinkList.png)

<!-- more -->

# 一、算法思路

## 1.1 建模

本题和 [合并两个有序链表（LeetCode No.21）](https://smallfan.net/2022/mergeLinkList/#more) 形式上比较相似，合并两个有序链表时是`合二为一`，而本题为逆向即`一分为二`。主要思路：把原链表分成两个链表l1、l2，l1中的元素大小都小于 `x`，l2中的元素都大于等于 `x`，最后再把这两条链表接到一起。

核心需要：

1. 新建两条单链表 l1、l2
2. 两个偏移指针，用于标记 l1、l2 当前的尾结点
3. 偏移指针p，用于遍历原链表
4. 对链表结点数据域的比对 `x` 的方法
5. 拼接 l1、l2，输出结果

## 1.2 注意事项

+ 新创建的单链表可以使用「虚拟头结点」，也就是` l1.head`、`l2.head` 节点。利用虚拟头结点进行占位，可以避免空指针边界异常，降低代码的复杂性。

+ 每次获取结点p拼接到对应新链表后，需要断开 `p.next`。

# 二、核心代码

```swift
func partitionLinkList(list: SingleLinkList<Int>, x: Int) -> SingleLinkList<Int> {
    let l1 = SingleLinkList<Int>(head: SingleLinkNode(data: -1))
    let l2 = SingleLinkList<Int>(head: SingleLinkNode(data: -1))
    var p1 = l1.head, p2 = l2.head
    var p = list.head
    
    while p != nil {
        if p!.data >= x {
            p2!.next = p
            p2 = p2?.next
        } else {
            p1!.next = p
            p1 = p1?.next
        }
        
        let temp = p!.next
        p!.next = nil
        p = temp
    }
    
    p1!.next = l2.head?.next
    return l1
}
```

> See the complete code for details: [https://github.com/Smallfan/SwiftDataStructure](https://github.com/Smallfan/SwiftDataStructure)
