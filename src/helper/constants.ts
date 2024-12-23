import { TreeNode } from "@/typings";

const BASIC_ASCII_TREE_TEMPLATE = `root
├── folder1
│   ├── file1
│   └── file2
└── folder2
    ├── file3
    └── file4`;

const VITE_REACT_TEMPLATE = `vite-react
├── public
│   └── vite.svg
├── src
│   ├── assets
│   ├── components
│   │   ├── ui
│   │   └── shared
│   ├── hooks
│   ├── pages
│   ├── styles
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .eslintrc.json
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts`;

const VITE_VUE_TEMPLATE = `vite-vue
├── public
│   └── vite.svg
├── src
│   ├── assets
│   ├── components
│   ├── composables
│   ├── stores
│   ├── views
│   ├── App.vue
│   ├── main.ts
│   └── vite-env.d.ts
├── .eslintrc.json
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── env.d.ts`;

const NEXTJS_APP_TEMPLATE = `next-app-dir
├── app
│   ├── (auth)
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api
│   │   └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components
│   ├── ui
│   └── shared
├── lib
│   ├── utils.ts
│   └── db.ts
├── public
│   ├── images
│   └── fonts
├── .env
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json`;

const NEXTJS_PAGES_TEMPLATE = `next-pages-dir
├── pages
│   ├── api
│   │   └── hello.ts
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── components
│   ├── ui
│   └── shared
├── lib
│   ├── utils.ts
│   └── db.ts
├── public
│   ├── images
│   └── fonts
├── styles
│   └── globals.css
├── .env
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json`;

const T3_APP_TEMPLATE = `t3-app
├── prisma
│   └── schema.prisma
├── src
│   ├── env.js
│   ├── env.mjs
│   ├── server
│   │   ├── api
│   │   │   └── routers
│   │   │       ├── post.ts
│   │   │       └── user.ts
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── trpc.ts
│   ├── styles
│   │   └── globals.css
│   ├── app
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── utils
│       └── api.ts
├── .env
├── next.config.mjs
├── package.json
├── postcss.config.cjs
├── tailwind.config.ts
└── tsconfig.json`;

const MONOREPO_TEMPLATE = `monorepo
├── apps
│   ├── web
│   │   ├── src
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── docs
│       ├── src
│       ├── package.json
│       └── tsconfig.json
├── packages
│   ├── ui
│   │   ├── src
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config
│   │   ├── eslint
│   │   └── typescript
│   └── utils
│       ├── src
│       └── package.json
├── package.json
├── turbo.json
└── pnpm-workspace.yaml`;

const REMIX_TEMPLATE = `remix-app
├── app
│   ├── routes
│   │   ├── _index.tsx
│   │   └── blog
│   │       ├── $slug.tsx
│   │       └── index.tsx
│   ├── styles
│   │   └── global.css
│   ├── utils
│   ├── root.tsx
│   └── entry.client.tsx
├── public
│   └── assets
├── .env
├── package.json
├── remix.config.js
└── tsconfig.json`;

const ASTRO_TEMPLATE = `astro-site
├── src
│   ├── components
│   │   └── Card.astro
│   ├── layouts
│   │   └── Layout.astro
│   ├── pages
│   │   └── index.astro
│   └── content
│       ├── blog
│       └── config.ts
├── public
│   └── assets
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
└── tsconfig.json`;

const SVELTEKIT_TEMPLATE = `sveltekit-app
├── src
│   ├── lib
│   │   ├── server
│   │   └── components
│   ├── routes
│   │   ├── +layout.svelte
│   │   └── +page.svelte
│   └── app.html
├── static
├── tests
├── .env
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json`;

const PROJECT_TEMPLATES = {
  basic: {
    name: "Basic Structure",
    template: BASIC_ASCII_TREE_TEMPLATE,
  },
  viteReact: {
    name: "Vite (React)",
    template: VITE_REACT_TEMPLATE,
  },
  viteVue: {
    name: "Vite (Vue)",
    template: VITE_VUE_TEMPLATE,
  },
  nextApp: {
    name: "Next.js (App Router)",
    template: NEXTJS_APP_TEMPLATE,
  },
  nextPages: {
    name: "Next.js (Pages Router)",
    template: NEXTJS_PAGES_TEMPLATE,
  },
  t3App: {
    name: "T3 Stack (Next.js + tRPC)",
    template: T3_APP_TEMPLATE,
  },
  monorepo: {
    name: "Monorepo (Turborepo)",
    template: MONOREPO_TEMPLATE,
  },
  remix: {
    name: "Remix",
    template: REMIX_TEMPLATE,
  },
  astro: {
    name: "Astro",
    template: ASTRO_TEMPLATE,
  },
  sveltekit: {
    name: "SvelteKit",
    template: SVELTEKIT_TEMPLATE,
  },
} as const;

const INITIAL_TREE: TreeNode = {
  id: "root",
  name: "root",
  children: [
    {
      id: "1",
      name: "folder1",
      children: [
        {
          id: "2",
          name: "file1",
        },
        {
          id: "3",
          name: "file2",
        },
      ],
    },
    {
      id: "4",
      name: "folder2",
      children: [
        {
          id: "5",
          name: "file3",
        },
        {
          id: "6",
          name: "file4",
        },
      ],
    },
  ],
};

export {
  BASIC_ASCII_TREE_TEMPLATE,
  VITE_REACT_TEMPLATE,
  VITE_VUE_TEMPLATE,
  NEXTJS_APP_TEMPLATE,
  NEXTJS_PAGES_TEMPLATE,
  T3_APP_TEMPLATE,
  MONOREPO_TEMPLATE,
  REMIX_TEMPLATE,
  ASTRO_TEMPLATE,
  SVELTEKIT_TEMPLATE,
  PROJECT_TEMPLATES,
  INITIAL_TREE,
};
