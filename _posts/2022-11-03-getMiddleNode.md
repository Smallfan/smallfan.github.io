---
title: 链表的中间结点（LeetCode No.876）
author: Smallfan
date: 2022-11-03 21:40:11 +0800
categories: [技术, 数据结构算法]
tags: [算法, 数据结构, 链表]
pin: true
math: true
mermaid: true
image:
  path: https://blogpic.smallfan.top/alg/getMiddleNode.png
---

# 一、算法思路

## 1.1 建模

本题类似 [链表中倒数第k个节点（剑指offer No.22）](https://smallfan.net/2022/getKthFromEnd/) 中初始思路一样，无法直接得到单链表的长度 `n`，所以无法在一次遍历前提下确认 `n /2` 个结点。 上述文章采用 `等距离位移法`, 确认了目标位置。而在本题中`k`即为`n / 2`，无法直接采用相同思路建模。思考下，要在一个序列中如何在遍历时同步拉开一半距离？换个角度：甲乙两人围着操场跑一圈，什么情况下当甲到达终点（即一圈）时，乙刚好跑一半？是不是乙的速度是甲的一半时，刚好具备？这不刚好就是 **快慢指针** ? 快慢指针通常用于 “判断链表是否有环” ，但在本题中也适用。

核心需要：

1. 两个偏移指针，slow 每次偏移1步， fast 每次偏移2步
2. 结束条件：fast 遍历结束

## 1.2 注意事项

+ fast 指针的结束边界需要严格限定，防止溢出。

# 二、核心代码

```swift
func getMiddleNode(list: SingleLinkList<Int>) -> SingleLinkNode<Int>? {
    if list.head == nil { return nil }
    if list.count == 1 { return list.head }
    
    var slow = list.head, fast = list.head
    while fast != nil && fast?.next != nil {
        slow = slow?.next
        fast = fast?.next?.next
    }
    
    return slow
}
```

> See the complete code for details: [https://github.com/Smallfan/SwiftDataStructure](https://github.com/Smallfan/SwiftDataStructure)
