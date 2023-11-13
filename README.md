# astro-wc-ssr-demo
tl;dr—[`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) and the `HTMLTemplateElement` [`content`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement/content) property in combination with the `Node` [`cloneNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) method are probably the best bits to come out of the [Web Component API](https://developer.mozilla.org/en-US/docs/Web/API/Web_components#html_templates).

The following will discuss a recipe for implementing server rendered Web Components with any server language of choice (while commenting on some the ongoing trends in the Web Component narrative); i.e. without being locked into running JS on the server.
[Astro](https://astro.build/) is just used as a convenient server platform/templating engine but no "Web Component JS code" is run on the server (i.e. [isomorphic JS](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) isn't a requirement).

Lack of standardized SSR support is one of the greatest drawbacks of Web Components, especially as we are in the process of transitioning into [Generation 3](https://igor.dev/posts/experiences-web-frameworks-future-me/#return-to-server).
Granted some frameworks aim to support SSR ([Lit](https://lit.dev/docs/ssr/overview/) in particular but it still requires JS on the server) but at that point *one has already adopted a framework* which is acceptable if that is the shop framework.
Even when it comes to μ-frontends, the going recommendation is to stick to one, [single framework (and version)](https://youtu.be/A3n1n5QRmF0?t=1657). 

The argument that any Web Component based framework will be comparatively [longer-lived](https://jakelazaroff.com/words/web-components-will-outlive-your-javascript-framework/) because "it's based on a platform standard" is also more than a little bit disingenuous ([AppCache](https://web.archive.org/web/20210603132501/https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache) ([2018](https://groups.google.com/a/chromium.org/g/blink-dev/c/FvM-qo7BfkI/m/0daqyD8kCQAJ)) would like a word); Polymer in particular went trough a number of major revisions over the years (1.0 (2015), 2.0 (2017), 3.0 (2018), lit-html (2017), Lit 1.0 (2019), Lit 2.0 (2021), Lit 3.0 (2023)).

This particular example is based on a reworked version of the [Web Components: From zero to hero](https://thepassle.github.io/webcomponents-from-zero-to-hero/) tutorial. Like most tutorials of this kind, it's shamelessly component-oriented ([centric](https://twitter.com/acemarke/status/1056669495354421249)) and by extension [client-side rendered (CSR)](https://www.patterns.dev/react/client-side-rendering) focused (very [pre-2016](https://github.com/vercel/next.js/releases/tag/1.0.0) and firmly rooted in the traditions of the [desktop web](https://youtu.be/wsdPeC86OH0?t=472)). *Continued in [More Thoughts on Web Components](#more-thoughts-on-web-components).*

## The Recipe

### 1. All markup is invariably server rendered.

At this point we've already achieved SSR but what does this have to do with Web Components? *Hint*: we aren't going to be using any [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) or [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates), vanilla or library supported as it is common in many Web Components. It's simply not possible, as we want to be able to server render in *any* server side language. Looking at the demo:

```Astro
---
// file: src/components/todos-view.astro
import type { Todo } from '../types';
import TodoItem from './todo-item.astro';

interface Props {
  title: string;
  todoItems: Todo[];
}

const { title, todoItems } = Astro.props;
---

<todos-view>
  <h3>{title}</h3>
  <br />
  <h1>To do</h1>
  <form>
    <input
      type="text"
      placeholder="Add a new to do"
      class="js:c-todos-view__title"
    />
    <button class="js:c-todos-view__new">✅</button>
  </form>
  <ul class="js:c-todos-view__list">
    {todoItems.map((todo) => <TodoItem todo={todo} />)}
  </ul>
</todos-view>
```

[Astro components](https://docs.astro.build/en/core-concepts/astro-components/) are essentially server rendered partials using a JSX-like (but more HTML adjacent) templating syntax that is preceded by some preparatory JavaScript (or TypeScript in this case) code in the frontmatter. `todos-view` is the Web Component which is clearly passed some child content. The component starts to manage any relevant parts of the light DOM (i.e. normal DOM, as opposed to [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)) that it contains.

> FYI: A `js:` prefix identifies a class name as a [JavaScript hook](https://cssguidelin.es/#javascript-hooks); i.e. it's selected and/or manipulated by JS code, so it shouldn't be renamed during a pure CSS refactor. The `c-` prefix [namespaces](https://csswizardry.com/2015/08/bemit-taking-the-bem-naming-convention-a-step-further/#namespaces) the class name as being (visual design) component-related (design system and UI component boundaries don't always coincide). 

A list item for `todos-view.astro` is rendered with the `todo-item.astro` Astro template (another partial).

```Astro
---
// file: src/components/todo-item.astro
import type { Todo } from '../types';

interface Props {
  todo?: Todo;
}

const todo = Astro.props.todo;
const [todoId, title, index, checked] = todo
  ? [todo.id, todo.title, String(todo.index), todo.completed ? '' : undefined]
  : ['', '', '', undefined];
---

<li class="c-todos-view__item" data-index={index}>
  <label data-id={todoId}>
    <input type="checkbox" checked={checked} />{title}
  </label>
  <button>❌</button>
</li>
```

Note that unlike the original example there isn't another Web Component (`to-do-item`) here. See [*some thoughts on the original example*](#some-thoughts-on-the-original-example) for further discussion.

The `todos-view.astro` component is rendered as part of the page:

```Astro
---
// file: src/pages/index.astro
import Base from '../layouts/base.astro';
import MainTemplates from '../templates/main-templates.astro';
import TodosView from '../components/todos-view.astro';
import { selectTodos } from './todos-store';

const todoItems = await selectTodos(Astro.locals.sessionId);
const title = `Astro "WC: zero to hero" Todos`;
---

<Base {title}>
  <TodosView {title} {todoItems} />
  <MainTemplates />
  {
    /* <script is:inline id="resume-data" type="application/json" set:html={JSON.stringify(todoItems)} /> */
  }
</Base>
```

### 2. Isolate the parts of the markup that are needed client side.

In this case only the markup needed is in `todo-item.astro`. One key detail:

```Typescript
interface Props {
  todo?: Todo;
}
```

The partial needs to be able to render itself as a *blank*. Here when the partial isn't passed a `todo` prop it renders the blank variant of itself.

### 3. Include the client partials in `<template>` elements within the page.

This is what the `<MainTemplates />` Astro component in the page accomplishes.

```Astro
---
// file: src/templates/main-templates.astro
import TodoItem from '../components/todo-item.astro';
---

<template id="template-todo-item">
  <TodoItem />
</template>
```
Each template can be easily selected via its `id`. Given that there is only one relevant partial (`todo-item.astro`), there is only one `<template>` element (`id="template-todo-item"`).

### 4. Select the template inside the Web Component module.

Most modern JavaScript is loaded [`async`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#async), [`defer`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer) or [`type="module"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#module), i.e. by the time the document has already been fully parsed. So the Web Component module can be initialized (`todosView.initialize()`) when the bundle entry code is run:

```JavaScript
// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import * as todosView from './components/todos-view';

function assembleApp() {
  const actions = makeTodoActions('/api/todos');
  return makeApp({
    addTodo: actions.addTodo,
    removeTodo: actions.removeTodo,
    toggleTodo: actions.toggleTodo,
  });
}

/** @param { ReturnType<typeof makeApp> } app
 * @returns { void }
 */
function hookupUI(app) {
  todosView.initialize({
    addTodo: app.addTodo,
    removeTodo: app.removeTodo,
    toggleTodo: app.toggleTodo,
    subscribeTodoEvent: app.subscribeTodoEvent,
  });

  customElements.define(todosView.NAME, todosView.TodosView);
}

hookupUI(assembleApp());
```

And

```JavaScript
// @ts-check
// file: src/components/todos-view.js

// … 

const NAME = 'todos-view';
const TEMPLATE_ITEM_ID = 'template-todo-item';

// … 

function getItemBlank() {
  const template = document.getElementById(TEMPLATE_ITEM_ID);
  if (!(template instanceof HTMLTemplateElement))
    throw Error(`${TEMPLATE_ITEM_ID} template not found`);

  const root = template.content.firstElementChild;
  if (!(root instanceof HTMLLIElement))
    throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

  return root;
}

// … 

/** @typedef { object } Module
 *  @property { AddTodo } addTodo
 *  @property { RemoveTodo } removeTodo
 *  @property { ToggleTodo } toggleTodo
 *  @property { SubscribeTodoEvent } subscribeTodoEvent
 *  @property { HTMLLIElement } itemBlank
 *  @property { Map<TodosView, Binder> } instances
 */

/** @type {Module | undefined} */
let module;

/** @param {{
 *  addTodo: AddTodo;
 *  removeTodo: RemoveTodo;
 *  toggleTodo: ToggleTodo;
 *  subscribeTodoEvent: SubscribeTodoEvent;
 * }} depend
 */
function initialize({ addTodo, removeTodo, toggleTodo, subscribeTodoEvent }) {
  module = {
    addTodo,
    removeTodo,
    toggleTodo,
    subscribeTodoEvent,
    itemBlank: getItemBlank(),
    instances: new Map(),
  };
}
```

### 5. When needed, clone the blank content and “fill in the blanks”. 

Once the `blank` content is cloned, simple selectors can locate the relevant elements in order to fill in the necessary information (here setting the `index` and `id` [data attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) and adding the [`Text`](https://developer.mozilla.org/en-US/docs/Web/API/Text) node with the todo's `title`)).

```Astro
// @ts-check
// file: src/components/todos-view.js

// … 

const SELECTOR_LABEL = 'label';
const SELECTOR_CHECKBOX = 'input[type=checkbox]';

// … 

/** @param {HTMLLIElement} blank
 * @param {Todo} todo
 */
function fillItem(blank, todo) {
  const root = /** @type{HTMLLIElement} */ (blank.cloneNode(true));
  const label = root.querySelector(SELECTOR_LABEL);
  const checkbox = root.querySelector(SELECTOR_CHECKBOX);
  if (
    !(label instanceof HTMLLabelElement && checkbox instanceof HTMLInputElement)
  )
    throw new Error('Unexpected <li> shape for todo');

  root.dataset['index'] = String(todo.index);
  checkbox.checked = todo.completed;
  label.dataset['id'] = todo.id;
  if (todo.title) label.appendChild(new Text(todo.title));

  return root;
}
```

### 6. Components don't communicate with each other but only with the client side app.

While this example only has one single Web Component the guideline still applies. The component's responsibilities are limited to delegating UI interactions to the client side application and projecting some client side application events to the UI. Any behaviour is extremely shallow and strictly limited to manipulating the DOM in response to “UI bound events” and converting DOM events to “application bound events” ([Humble Dialog](https://github.com/peerreynders/solid-bookstore-a/blob/main/assets/TheHumbleDialogBox.pdf)).

- To be continued

## Some Thoughts on the Original Example
- To be continued

## More Thoughts on Web Components
- [Eshewing Shadow DOM (2019)](https://every-layout.dev/blog/eschewing-shadow-dom/)
- [Why I don't use Web Components (2019)](https://dev.to/richharris/why-i-don-t-use-web-components-2cia)
- [Maybe Web Components are not the future? (2020)](https://dev.to/ryansolid/maybe-web-components-are-not-the-future-hfh)
- [The failed promise of Web Components (2020)](https://lea.verou.me/blog/2020/09/the-failed-promise-of-web-components/)
- [About Web Components (2021)](https://webreflection.medium.com/about-web-components-cc3e8b4035b0)
- Even back in 2003 it was clear that [getters and setters are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html).
- To be continued
