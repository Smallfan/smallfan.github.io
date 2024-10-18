---
title: 链表中倒数第k个节点（剑指offer No.22）
date: 2022-11-03 21:10:11
tags: ['算法', '数据结构', '链表' ]
categories:
- 技术
- 数据结构算法
cover: https://blogpic.smallfan.top/alg/getKthFromEnd.png
---

![](https://blogpic.smallfan.top/alg/getKthFromEnd.png)

<!-- more -->

# 一、算法思路

## 1.1 建模

先从最简单的思路开始，从前往后寻找第 `k` 个结点，一个 `for`循环搞定，时间复杂度 `O(n)`。但是如何寻找从后往前数的第 `k` 个节点呢？ 假设链表有 `n` 个结点，亦即倒数第 `k` 个结点 位置为 `n - k + 1`。如果第一遍遍历确认了 `n` 的大小，需要第二次遍历寻找倒数第 `k` 个结点 ，实际上需要总遍历次数即为2次。如何减少遍历次数？能否做到一次结束？答案是肯定的，基本思路采用 `“等距位移法”`，即使用一个指针 p1 从 head 开始偏移 `k` 位，此时该指针距离head恒等于 `k`，此时再使用另一个指针 p2 从 head 开始，和 p1 同步偏移，整个过程中 `p1 - p2 = k`。当 p1 到 `尾结点` 的 next 时， p2 即为 第 `k` 个结点。

核心需要：

1. 两个偏移指针，p1 用于先行偏移 k 位，而后 p2 随 p1 同步位移
2. 结束条件：p1 遍历结束
3. ∵ p1 - p2 = k，∴ p2 = p1 - k ；当p1 = tail.next 时，p2 出于倒数第 `k` 位

## 1.2 注意事项

+ p1从头结点开始偏移，注意位移边界为 0 ..< k。


# 二、核心代码

```swift
func getKthFromEnd(list: SingleLinkList<Int>, k: Int) -> SingleLinkList<Int>? {
    if list.head == nil { return nil }
    if k > list.count - 1 { return nil }
    
    var p1 = list.head, p2 = list.head
    
    for _ in 0 ..< k {
        p1 = p1?.next
    }
    
    while p1 != nil {
        p2 = p2?.next
        p1 = p1?.next
    }
    
    return SingleLinkList<Int>(head: p2!)
}
```

> See the complete code for details: [https://github.com/Smallfan/SwiftDataStructure](https://github.com/Smallfan/SwiftDataStructure)
