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
支持项目模板功能，点击后选择比如 vite/react 即可创建对应的项目模板

从md文档直接读取无序列表，方便网友贡献模板


后续增加从自己的无需列表直接输入，这样一些不方便传上去的也能用了，比如自己公司内网的



> 因为存在文本编辑器部分编辑失败的情况，所以应该是双数据源
> 而且,双数据源


支持区分folder和普通文件, 支持注释
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
- 支持注释

```
company-project/              
  ├── main-egg-project/      
  │   ├── .git/             
  │   ├── package.json      
  │   └── app/
  │       └── public/
  │           └── antd-pro/ 
  │
  └── antd-project/         
      ├── .git/              
      ├── package.json     
      └── src/
```
folder 变成蓝色


```
.gitignore
README.md
components.json
doc/
└── note.md
eslint.config.js
index.html
package.json
pnpm-lock.yaml
postcss.config.js
public/
└── vite.svg
src/
├── App.tsx
└── assets/
    └── react.svg
└── components/
    └── mg/
        ├── ascii-tree-panel.tsx
        ├── ascii-tree-parser-dialog.tsx
        └── markdown-editor/
            ├── index.tsx
            └── text-editor.tsx
        ├── shortcuts.tsx
        └── tree-node.tsx
    └── ui/
        ├── accordion.tsx
        ├── alert.tsx
        ├── button.tsx
        ├── dialog.tsx
        ├── dropdown-menu.tsx
        ├── input.tsx
        ├── menubar.tsx
        ├── resizable.tsx
        ├── select.tsx
        ├── textarea.tsx
        ├── toast.tsx
        └── toaster.tsx
└── helper/
    ├── ascii-tree.ts
    ├── constants.ts
    ├── explorer.ts
    └── global.ts
└── hooks/
    ├── use-responsive-panel.ts
    ├── use-toast.ts
    └── use-tree-history.ts
├── index.css
└── lib/
    └── utils.ts
├── main.tsx
└── typings/
    └── index.ts
└── vite-env.d.ts
tailwind.config.js
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts


```


可以用 https://tree.uncenter.dev/ 配合， 是否还要自己实现这个project的功能？


目前generate from existing的时候会去掉结尾的 / 

future: 记录产生的是文件还是文件夹
没有标注 / 的则按照先前的规则,有子级的就是folder,没有的是文件.
然后在md 视图永远展示 / , 且没有 / & 有子级 会报错

folder那边用图标表示, 不展示 / 

ascii-tree那边生成的默认带有 / , 但是可以关闭掉 / 


文件夹和文件的颜色不一样在ascii-tree这边看的话
