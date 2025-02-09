# ASCII folder structure diagrams
## 当前已有功能
- global
  - 快捷键的列表
- explorer view
  - 基础交互
    - 增
      - add child
      - add sibling
      - 备注
        - 选中多个节点时所有增无效
    - 删
      - 删除单个节点
      - 删除多个节点
    - 改
      - 修改节点名称
    - 多选
      - ctrl+鼠标单击
      - shift+鼠标单击
  - 历史记录
    - 撤销 / 重做
      - 对应的快捷键
- markdown list view
  - 增删改查
  - 快捷操作
    - alt + ↑ 交换本行与上一行的节点
    - alt + ↓ 交换本行与下一行的节点
  - format
    - ctrl + S 格式化
      - 只有md view有效的时候可以用，并从explorer view 往 md view转化
      - 会有message提示
        - todo
  - 历史记录
    - 撤销 / 重做
      - 对应的快捷键
- ascii-tree view
  - resizable
  - collapsible


## 注意

# 后续idea

## ai powered 小功能


## 快捷操作
- enter 保存重命名的内容
  - esc退出且不保存
- up&down挑选条目
- enter 进入编辑条目
- explorer view
  - 拖拽排序
  - alt+上下直接切换同级节点顺序，能跨母节点
  - 比如直接切换folder以及folder里面所有内容的顺序
  - 比如从 folder2的第一个节点直接切换到folder1的最后一个节点
- md view
  - 类似vscode里面快速文件编辑的操作
  - alt+上下可以直接交换行，tab操作缩进
    - 这种很容易出现非法目录结构，需要停止目录渲染，且标注出来实际错误在哪（md view内部）
  - alt+shift+↑↓快速复制

- undo，redo为跨分区的操作，全部都需要支持原子化
  - 可以先folder视图操作，然后md视图操作，最后terminal视图操作。此时还能连续undo，redo

> 三分区： markdown
>
> 额外变成四分区：支持svg来展示文件结构，变成导图形式，方便给其他人讲解

> 其实不用区分文件夹和file的图标，徒增麻烦
>  - 直接用markdown的 - 来弄bullet就行了


通常可以直接采用字母序排序。为了演示 or 给别人讲解文件结构的时候，不按照字母而是自己定义的序列其实更好


先做出来，之后替换拖拽等为自己的实现？

svg的支持当前图像下载和标准图像下载


分享成预览模式

完全分享编辑模式

手机端方便的编辑

嵌入mdshown, 以folder形式

## 模板
```
company-project/              # 公司总项目目录
  ├── main-egg-project/      # 原有的 egg 项目
  │   ├── .git/             # egg项目的git
  │   ├── package.json      # egg项目的依赖
  │   └── app/
  │       └── public/
  │           └── antd-pro/ # 只存放 antd pro 的构建产物
  │
  └── antd-project/         # antd pro 项目
      ├── .git/            # antd项目的git  
      ├── package.json     # antd项目的依赖
      └── src/
```


TODO
- md view 编辑有 / 结尾但是存在children的时候报错 ✅
- 一个专门的维修函数在各种保存结尾check和修复
- add file和add folder的时候需要focus到输入name的位置,然后输入name,并由validate是否为空的ui以及自由配置的validator
  - 之后补上save name的时候的同级重名节点的validator
- 抽离出复用的validator,目前每个部分validator都是分离的
- slash之前不能有空格

可以用 https://tree.uncenter.dev/ 配合， 是否还要自己实现这个project的功能？

enable comment in file and get gitignore as directoryIgnore



1.0之前必须做的事情
- done
  - 批量tab和un tab
  - 支持自动添加 /
  - 支持注释
  - 新建node时逻辑优化
    - 手动填入内容，光标移动过去
  - 有comment的部分需要正常着色
  - 版本号1.0

- todo
  - 没有已知bug
  - 支持中文


1.0后的feature
- 统一comment有关的识别逻辑
- 支持强制解析ascii tree
- 统一validate逻辑
  - validate与其他逻辑分离，牺牲少量性能换取可维护性
  - 存在两个validate阶段，一个是本身的（比如indent不对），一个是通用的（比如非文件夹节点不可能存在子集）
    - 通用的部分构建一个临时新树，然后validate
- 新建node时逻辑优化
    - validate node
- ctrl+/ 切换到注释部分
- format逻辑优化，保证光标位置正确
  - 还是现有format，然后计算光标新位置
- 优化默认的项目，默认的和reset的应该不是从ascii-tree来，而是从text来
  - 因为：需要支持自动识别auto slash的功能
- 行号
  - 一个小眼睛 👁 / 放在行号正上方，默认打开，点击会给👁 加个斜杠/
  - wrap时的行号
- auto slash的那个东西悬浮窗口希望完成文字环绕效果
- 手机兼容
- ascii view仅copy当前子树，悬浮的时候显示出当前子树的这个框框
- 新页面，集成tree命令生成工具，辅助ignore case
- 丰富的节点图标
- 生成截图
- 支持auto format
- 波浪线划出报错的部分
  - 一个小的弹出窗口来告诉是什么错误
- 支持quick fix
- ai powered format
  - ai fix ascii tree
  - 限额时的提示，从一个云函数或者云端数据库配置
- 右侧更新记录
- pwa
- folder view选定后 sort文件夹下all内容
- 节点拖拽排序
- 支持sort，自动sort
- 从md文档直接读取无序列表，方便网友贡献模板
  - 后续增加从自己的无需列表直接输入，这样一些不方便传上去的也能用了，比如自己公司内网的
- profiler性能优化
- contribution之前先发个issue告知一声，看看需不需要，以及是否和我做重了
  - 对于不希望加的功能，提议自己fork

# 当前剩余bug


# 当前可优化
统一对文本处理的正则：两种
- ascii
- md

# 坑与bug的解决

```js
 // 更新选区偏移量
if (i === startLineIndex) selectionStartOffset -= 2;
if (i === endLineIndex)
  selectionEndOffset -= 2 * (endLineIndex - startLineIndex + 1);
```
