---
title: 删除链表的倒数第 N 个结点（LeetCode No.19）
author: Smallfan
date: 2022-11-04 20:25:11 +0800
categories: [技术, 数据结构算法]
tags: [算法, 数据结构, 链表]
pin: true
math: true
mermaid: true
image:
  path: https://blogpic.smallfan.top/alg/removeKthFromEnd.png
---

# 一、算法思路

## 1.1 建模

本题思路上基本与 [链表中倒数第k个节点（剑指offer No.22）](https://smallfan.net/2022/getKthFromEnd/) 一致。直接采用 `等距离位移法`, 确认了要删除的位置 `n` 的前一位置，即 `n + 1` 位，而后就是常规的 **删除单链表结点操作**。

核心需要：

1. 定义新链表的 **虚拟头结点**
2. 通过 `等距离位移法` 找到 **倒数第 n + 1 位** 结点 `nNode`
3. 断开 `nNode`下一位结点

## 1.2 注意事项

+ 需要定义 **虚拟头结点** `chain`，防止出现空指针的情况。比如：list.count == 10，n == 10，此时需要删除的目标位为第一位，需要 find 到第 11 位，如果没有头结点需要处理溢出情况。
+ 单链表删除结点操作不赘述，需要可直接看代码。

# 二、核心代码

```swift
func removeKthFromEnd(list: SingleLinkNode<Int>, n: Int) -> SingleLinkNode<Int>? {
    let chain = SingleLinkNode(val: -1)
    chain.next = list

    let nNode = getKthFromEnd(list: chain, k: n + 1)
    guard let nNode else { return nil }

    nNode.next = nNode.next?.next
    return chain
}
```

> See the complete code for details: [https://github.com/Smallfan/SwiftDataStructure](https://github.com/Smallfan/SwiftDataStructure)