# astro-wc-ssr-demo (`qsa-observer` variant)
- [Web Component](../wc/README.md) variant
- [SolidJS](../solid-js/README.md) variant
- [Preact (no signals)](../preact/README.md) variant ([on StackBlitz](https://stackblitz.com/edit/withastro-astro-storbz))
- Top level [README](../README.md)

```shell
$ cd astro-wc-ssr-demo/qsa-observer
astro-wc-ssr-demo/qsa-observer$ npm i

added 733 packages, and audited 735 packages in 36s

236 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
astro-wc-ssr-demo/qsa-observer$ npm run client:build
> astro-wc-ssr-demo-qsa-observer@0.0.0 client:build
> ./node_modules/.bin/rollup -c src/client/rollup.config.mjs

src/client/entry.js → public/main.js...
created public/main.js in 436ms
astro-wc-ssr-demo/qsa-observer$ npm run dev

> astro-wc-ssr-demo-qsa-observer@0.0.0 dev
> astro dev

  🚀  astro  v3.6.0 started in 125ms
  
  ┃ Local    http://localhost:4321/
  ┃ Network  use --host to expose
  
04:58:07 p.m. [content] Watching src/content/ for changes
04:58:07 p.m. [content] Types generated
```
