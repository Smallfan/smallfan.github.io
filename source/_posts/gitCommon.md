---
title: Git 基本构成及常见问题
date: 2023-04-26 14:31:55
tags: ['Git', '开发工具' ]
categories:
- 技术
- 开发工具
cover: https://pic.smallfan.top/20230426144937.png
---

- 本文适合人群：具备 Git 基本使用经验的软件开发工程师、测试工程师、运维工程师等
- 本文学习目的：理解 Git 中最基本原理部分，以求触类旁通，在遇到突发问题时具备自行分析能力
- 建议阅读时间：30分钟

# 一、基本构成

Git由 对象库（Object store） 和 索引（index） 构成。

## 1.1 对象库

主要包含4种类型**原子对象** ：块（blob）、目录树（tree）、提交（commit）、标签（tag）。

块: 文件的每一个版本表示为一个块, 保存文件数据, 但不包含任何关于这个文件的元数据, 连文件名都没有

> > blob: ”binary large object” 二进制大对象

目录树: 代表一层目录信息, 记录blob标识符/路径名/和目录中所有文件的一些元数据, 也可以递归引用其他目录树和子树对象, 本质上为树形数据结构存储

提交: 保存版本库中每一次变化的元数据, 包括作者/提交者/提交日期和日志信息.<br>每个提交对象指向一个目录树对象, 这个目录树对象在一张完整的快照中捕获提交时版本库的状态

标签: 分配一个任意的且人类刻度的名字给一个特定对象

为有效地利用磁盘空间和网络带宽，Git把对象压缩并存储在打包文件(pack file)里, 这些文件也在对象库里。

## 1.2 索引

索引是一个临时的、动态的二进制文件，它描述整个版本库的目录结构。更具体地说，索引捕获项目在某个时刻的整体结构的一个版本。项目的状态可以用一个提交和一棵目录树表示，它可以来自项目历史中的任意时刻，或者它可以是你正在开发的未来状态。

Git的关键特色之一就是它允许你用有条理的、定义好的步骤来改变索引的内容。索引使得开发的推进与提交的变更之间能够分离开来。

Git通过目录树（tree）的对象来跟踪文件的路径名。当使用git add命令时，Git会给添加的每个文件的内容创建一个对象，但它并不会马上为树创建一个对象。相反，只更新了索引。

索引位于.git/index中，跟踪文件的路径名和相应的blob<br>每次执行git add / git rm /git mv 的时候, 会使用新的路径名和blob信息来更新索引

查看当前索引中文件与blob关联的命令<br>git ls-files -s<br>捕获当前索引状态并保存到一个树对象的命令<br>git write-tree

## 1.3 可寻址内容名称

对象库中的每一个对象都有一个唯一的名称，由对象的内容应用SHA1得到的散列值。

> > SHA1的值是一个160位的数, 表示一个40位的十六进制数<br>在不同目录甚至不同机器中, 对相同内容始终产生同样的ID<br>Git中SHA1别称: 散列码、对象ID<br>SHA1是“安全散列加密”算法, 直到现在没有任何已知方法可以刻意碰撞。<br>对于160位数, 你有2^160或者大约10^48种可能, 一万亿人每秒产生一万亿个新的唯一blob对象, 持续一万亿年, 也只有10^43个blob对象

## 1.4 Git追踪内容

关键概念1：Git追踪的是内容，而不是文件次相关的文件名或者目录名。

1. 如果两个文件内容完全一样只保存一份blob形式的内容副本

2. 如果其中一个发生变化，会为它计算新的SHA1值并加到对象库中

关键概念2：Git内部数据库有效地存储每个文件的每个版本，而不是他们的差异。

因为Git使用一个文件的全部内容的散列值作为文件名，所以它必须对每个文件的完整副本进行操作<br>Git不能将工作或者对象库条目建立在文件内容的一部分或者文件的两个版本之间差异上

> > 问题：存储每个文件每个版本的完整内容是否太低效?

## 1.5 打包文件(pack file)

定位内容相似全部文件, 为他们之一存储整个内容, 之后计算相似文件之间的差异并且只存储差异。<br>Git还维护打包文件表示中每个完整文件（包括完整内容的文件和通过差异重建出来的文件）的原始blob的SHA1值, 这给定位包内对象的索引机制提供了基础。

使用散列值把blob/目录树从对象库里提取出来的命令:<br>git cat-file -p xxx(SHA1)<br>通过对象唯一前缀来查找对象的散列值:<br>Git rev-parse xxxx(短前缀)

# 二、演示图示

## 2.1 创建仓库

``` shell

mkdir temp

cd temp

git init

```

## 2.2 创建一个新文件

``` shell

touch test.txt

echo "hello" > test.txt

cat test.txt // 输出hello

```

## 2.3 将新文件添加到索引

``` shell

git add test.txt

// 查看当前索引中文件与blob关联

git ls-files -s // 输出 100644 ce013625030ba8dba906f756967f9e9ca394464a 0 test.txt

// 查看此时git object目录

find .git/objects

/* 输出以下内容

.git/objects

.git/objects/pack

.git/objects/info

.git/objects/ce

.git/objects/ce/013625030ba8dba906f756967f9e9ca394464a

*/

```

## 2.4 查看blob对象内容

``` shell

git cat-file -p ce013625030ba8dba906f756967f9e9ca394464a // 输出 hello

```

## 2.5 创建树对象

``` shell

git write-tree // 输出 920512d27e4df0c79ca4a929bc5d4254b3d05c4c

// 查看此时git object目录

find .git/objects

/* 输出以下内容

.git/objects

.git/objects/92

.git/objects/92/0512d27e4df0c79ca4a929bc5d4254b3d05c4c

.git/objects/pack

.git/objects/info

.git/objects/ce

.git/objects/ce/013625030ba8dba906f756967f9e9ca394464a

*/

// 查看树对象内容

git cat-file -p 920512d27e4df0c79ca4a929bc5d4254b3d05c4c // 输出 100644 blob ce013625030ba8dba906f756967f9e9ca394464a test.txt

```

## 2.6 手动创建提交对象

``` shell

echo -n "first commit" | git commit-tree 920512d27e4df0c79ca4a929bc5d4254b3d05c4c

// 输出 5d1b1de556bdd019f138052cc791de11027c37a2

// 查看提交对象内容

git cat-file -p 5d1b1de556bdd019f138052cc791de11027c37a2

/* 输出以下内容

tree 920512d27e4df0c79ca4a929bc5d4254b3d05c4c

author fordxiao <fordxiao@futunn.com> 1620303459 +0800

committer fordxiao <fordxiao@futunn.com> 1620303459 +0800

first commit

*/

// 查看此时git object目录

/* 输出以下内容

.git/objects

.git/objects/92

.git/objects/92/0512d27e4df0c79ca4a929bc5d4254b3d05c4c

.git/objects/pack

.git/objects/5d

.git/objects/5d/1b1de556bdd019f138052cc791de11027c37a2

.git/objects/info

.git/objects/ce

.git/objects/ce/013625030ba8dba906f756967f9e9ca394464a

*/

```

## 2.7 将master分支head指向刚刚的commit

``` shell

// 没有log生成，显示的错误原因是HEAD没有指定有效的版本

git log

// 更新master分支的head的值，指向我们的commit对象

git update-ref refs/heads/master 5d1b1de556bdd019f138052cc791de11027c37a2

// 此时就有log了

git log

```

综上整个过程，其实就是从 修改内容 -> 执行git add -> 执行 git commit 的底层分解步骤，对象结构如下图：

![](https://pic.smallfan.top/202302272041394.png)

# 三、日常实践常见问题（持续更新）

## Q1 如何回滚单个或多个连续的commit

``` shell

git revert <old commit>..<new commit>

// 举个栗子

git revert dfca3e328f

git revert c93eb7f88..dfca3e328f

```

## Q2: feature分支合并入主版本分支后，想回滚应该怎么操作

``` shell

// 假设feature分支名为A，主版本分支（合并分支）名为master

// 首先保证当前处在主版本分支

git checkout master

/* 执行回滚

-m 之后可以是1或者2

1代表保留合并分支内容，即master分支

2代表保留被合并分支内容，即A分支

commit_id为合并产生的merge commit

下面操作将保留master分支的修改，而撤销A分支合并过来的修改

*/

git revert -m 1 <commit_id>

```

## Q3: feature分支想借助ReviewBoard发CodeReview，应该注意哪些问题

ReviewBoard脚本postreview.py中明确指出：

``` shell

postreview.py -s -r <review Id> {[<earlier commit Id>-]<commit Id>}|{<commit Id>,<commit Id>,...}

-s 表示把staged文件提交review

-r 表示要提交到一个已经publish的review里边来更新该review

<commit Id>可以是长Id也可以是短Id

postreview.py <commit Id>:

把<commit Id>对应的commit提交去review

例如： postreview b400c4e

postreview.py <earlier commit Id>-<commit Id>:

把从<earlier commit Id>到<commit Id>所对应的范围内的(连续的)所有commit都提交去review

例如：postreview.py b400c4e-91970bf

postreview.py <commit Id>,<commit Id>,...

把分立的多个commit提交到同一个review里边(这commitID的顺序需要注意下，最早的提交应该在最前)

例如 postreview.py 83d452d,03d6025,6e69a6a

```

commit id必须是连续的，那么会发生常见无法正常发CR的情况：

- 拉取feature分支后，提交若干commit，反合入其他分支内容，继续提交若干个commit，导致最终需要CR的commit不连续，无法正常使用ReviewBoard

所以在需求开发过程中，我们应该尽量做到：

1. 拉取feature分支后，尽量不再合入其他分支内容，保持提交树干净

2. 力求做到每个commit原子性，忌讳“一个commit中完成多项工作”或“一项工作分了多个commit进行”

针对特殊情况下如依赖因素导致的反合其他分支内容非抗力因素，建议在将feature分支合入master/version分支时，发起MergeRequest,这样在gitlab上依旧能生成对应的diff content

## Q4: 开发过程中被紧急问题突发打断，如何快速切换现场

一种常见的做法就是准备多个group, 通过物理隔离的方法来做到多分支维护；然而有些时候可能在小规模变更产生之后，需要切换到另一条分支或者回到当前分支远程Head指针状态下进行其他操作，此时就需要暂存这些现场。<br>一般可能会执行git commit来暂存变更，但这样做有一个坏处，即“破坏了commit原子性和完整性”的原则，这个commit的内容是临时的，这对于后续的提交树维护是存在极大风险的。为此，更推荐采用git stash来进行缓存。

git stash可以理解为一个栈，负责将当前索引区的变更产生一个临时pack file，缓存到栈中，随后可以随时取出，遵循FILO原则。

``` shell

// 将当前索引区内容存入栈中

git stash push

// 获取当前栈列表

git stash list

// 将栈顶的内容还原到当前索引区

git stash pop

```

## Q5: git pull执行不顺畅时，如何快速清理现场

``` shell

// 清理索引区中所有的untracked files和目录（注意，此时未commit的新增文件将会被全部清理）

git clean -fd

// 放弃索引区中所有的tracked文件变更（注意，此时未commit的变更内容将会被全部清理）

git checkout .

// 重新拉取

git pull

```

## Q6: 如何放弃本地所有内容，直接对齐对应远程分支内容

``` shell

// 清理索引区中所有的untracked files和目录（注意，此时未commit的新增文件将会被全部清理）

git clean -fd

// 放弃索引区中所有的tracked文件变更（注意，此时未commit的变更内容将会被全部清理）

git checkout .

// 获取远程最新commit

git fetch

// 将本地分支head设置为远程head

git reset --hard origin/分支名

```