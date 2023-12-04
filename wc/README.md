# astro-wc-ssr-demo (Web Component variant)
- [`qsa-observer`](../qsa-observer/README.md) variant
- [SolidJS](../solid-js/README.md) variant ([on StackBlitz](https://stackblitz.com/edit/withastro-astro-qxsuvd)) 
- [Preact (no signals)](../preact/README.md) variant ([on StackBlitz](https://stackblitz.com/edit/withastro-astro-storbz))
- Top level [README](../README.md)

```shell
$ cd astro-wc-ssr-demo/wc
astro-wc-ssr-demo/wc$ npm i

added 731 packages, and audited 733 packages in 46s

236 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
astro-wc-ssr-demo/wc$ npm run client:build

> astro-wc-ssr-demo-wc@0.0.0 client:build
> ./node_modules/.bin/rollup -c src/client/rollup.config.mjs


src/client/entry.js → public/main.js...
created public/main.js in 358ms
astro-wc-ssr-dem/wc$ npm run dev

> astro-wc-ssr-demo-wc@0.0.0 dev
> astro dev

  🚀  astro  v3.6.0 started in 122ms
  
  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
  
05:21:04 p.m. [content] Watching src/content/ for changes
05:21:05 p.m. [content] Types generated
```

