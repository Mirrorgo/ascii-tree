# ASCII folder structure diagrams
## 当前已有功能
- folder view
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


# 后续idea

## ai powered 小功能


## 快捷操作
- enter 保存重命名的内容
  - esc退出且不保存
- up&down挑选条目
- enter 进入编辑条目
- folder view
  - alt+上下直接切换同级节点顺序，能跨母节点
  - 比如直接切换folder以及folder里面所有内容的顺序
  - 比如从 folder2的第一个节点直接切换到folder1的最后一个节点
- md view
  - 类似vscode里面快速文件编辑的操作
  - alt+上下可以直接交换行，tab操作缩进
    - 这种很容易出现非法目录结构，需要停止目录渲染，且标注出来实际错误在哪（md view内部）

- undo，redo为跨分区的操作，全部都需要支持原子化
  - 可以先folder视图操作，然后md视图操作，最后terminal视图操作。此时还能连续undo，redo

> 三分区： markdown，
>
> 额外变成四分区：支持svg来展示文件结构，变成导图形式，方便给其他人讲解

> 其实不用区分文件夹和file的图标，徒增麻烦
>  - 直接用markdown的 - 来弄bullet就行了


通常可以直接采用字母序排序。为了演示 or 给别人讲解文件结构的时候，不按照字母而是自己定义的序列其实更好


先做出来，之后替换拖拽等为自己的实现？



## 模板
支持项目模板功能，点击后选择比如 vite/react 即可创建对应的项目模板

从md文档直接读取无序列表，方便网友贡献模板


后续增加从自己的无需列表直接输入，这样一些不方便传上去的也能用了，比如自己公司内网的