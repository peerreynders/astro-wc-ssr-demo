# astro-wc-ssr-demo
tl;dr—[`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) and the `HTMLTemplateElement` [`content`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement/content) property in combination with the `Node` [`cloneNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) method are probably the best bits to come out of the [Web Component API](https://developer.mozilla.org/en-US/docs/Web/API/Web_components#html_templates).

The following will discuss a strategy for implementing server rendered web components with any server language of choice (while commenting on some the ongoing trends in the web component narrative); i.e. without being locked into running JS on the server.
[Astro](https://astro.build/) is just used as a convenient server platform/templating engine but no "web component JS code" is run on the server (i.e. [isomorphic JS](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) isn't a requirement).

Lack of standardized SSR support is one of the greatest drawbacks of web components, especially as we are in the process of transitioning into [Generation 3](https://igor.dev/posts/experiences-web-frameworks-future-me/#return-to-server).
Granted some frameworks aim to support SSR ([Lit](https://lit.dev/docs/ssr/overview/) in particular but it still requires JS on the server) but at that point *one has already adopted a framework* which is acceptable if that is the shop framework.
Even when it comes to μ-frontends the going recommendation is to stick to one, [single framework (and version)](https://youtu.be/A3n1n5QRmF0?t=1657). 

The argument that any web component based framework will be comparatively longer-lived because "it's based on a platform standard" is also more than a little bit disingenuous ([AppCache](https://web.archive.org/web/20210603132501/https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache) ([2018](https://groups.google.com/a/chromium.org/g/blink-dev/c/FvM-qo7BfkI/m/0daqyD8kCQAJ)) would like a word); Polymer in particular went trough a number of major revisions over the years (1.0 (2015), 2.0 (2017), 3.0 (2018), lit-html (2017), Lit 1.0 (2019), Lit 2.0 (2021), Lit 3.0 (2023)).

This particular example is based on the [Web Components: From zero to hero](https://thepassle.github.io/webcomponents-from-zero-to-hero/) tutorial.

*Continued in [More Thoughts on Web components](#more-thoughts-on-web-components).*

## The Recipe
- To be continued

## More Thoughts on Web Components
- Even back in 2003 it was clear that [getters and setters are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html).
- To be continued
