---
title: 合并两个有序链表（LeetCode No.21）
author: Smallfan
date: 2022-11-03 19:50:11 +0800
categories: [技术, 数据结构算法]
tags: [算法, 数据结构, 链表]
pin: true
math: true
mermaid: true
image:
  path: https://blogpic.smallfan.top/alg/mergeLinkList.png
---

# 一、算法思路

## 1.1 建模

这题非常简单，作为系列开篇。将两个有序单链表进行合并，本质思路是使用两个逐一偏移指针`p1`、`p2`对链表`l1`、`l2`进行元素比对，获取`min（p1, p2）`元素拼接到新链表（结果链表）上。抽象来看，像拉拉链一样。l1、l2为拉链的左右链，拉取的过程是融合两者元素，形成拉完后的链条。

核心需要：

1. 两个偏移指针，逐一遍历l1、l2
2. 对链表结点数据域的比对方法
3. 一条新的单链表，用于承载结果

## 1.2 注意事项

+ 新创建的单链表可以使用「虚拟头结点」，也就是 chain 节点。利用虚拟头结点进行占位，可以避免空指针边界异常，降低代码的复杂性。

+ 两条待处理的单链表长度是不一定相等的，需要考虑较长链表多出部分的结点处理。

# 二、核心代码

```swift
func mergeTwoLists(l1: SingleLinkList<Int>, l2: SingleLinkList<Int>) -> SingleLinkList<Int> {
    let chain = SingleLinkList<Int>(head: SingleLinkNode(data: -1))
    var p = chain.head!
    var p1: SingleLinkNode? = l1.head
    var p2: SingleLinkNode? = l2.head
    
    while p1 != nil && p2 != nil {
        if p1!.data < p2!.data {
            p.next = p1
            p1 = p1?.next
        } else {
            p.next = p2
            p2 = p2?.next
        }
        
        if let next = p.next {
            p = next
        }
    }
    
    if (p1 != nil) {
         p.next = p1
     }
     
     if (p2 != nil) {
         p.next = p2
     }
     
     return chain
}
```

> See the complete code for details: [https://github.com/Smallfan/SwiftDataStructure](https://github.com/Smallfan/SwiftDataStructure)
