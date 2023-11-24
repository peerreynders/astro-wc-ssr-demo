# astro-wc-ssr-demo
tl;dr—[`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) and the `HTMLTemplateElement` [`content`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement/content) property in combination with the `Node` [`cloneNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) method are probably the best bits to come out of the [Web Component API](https://developer.mozilla.org/en-US/docs/Web/API/Web_components#html_templates).

- [Web Component](wc/README.md) variant
- [`qsa-observer`](qsa-observer/README.md) variant

The following will discuss a recipe for implementing server rendered Web Components with any server language of choice (while commenting on some the ongoing trends in the Web Component narrative); i.e. without being locked into running JS on the server.
[Astro](https://astro.build/) is just used as a convenient server platform/templating engine but no "Web Component JS code" is run on the server (i.e. [isomorphic JS](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) isn't a requirement).

Lack of standardized SSR support is one of the greatest drawbacks of Web Components, especially as we are in the process of transitioning into [Generation 3](https://igor.dev/posts/experiences-web-frameworks-future-me/#return-to-server).
Granted some frameworks aim to support SSR ([Lit](https://lit.dev/docs/ssr/overview/) in particular but it still requires JS on the server) but at that point *one has already adopted a framework* which is acceptable if that is the shop framework.
Even when it comes to μ-frontends, the going recommendation is to stick to one, [single framework (and version)](https://youtu.be/A3n1n5QRmF0?t=1657).

The argument that any Web Component based framework will be comparatively [longer-lived](https://jakelazaroff.com/words/web-components-will-outlive-your-javascript-framework/) because "it's based on a platform standard" is also more than a little bit disingenuous ([AppCache](https://web.archive.org/web/20210603132501/https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache) ([2018](https://groups.google.com/a/chromium.org/g/blink-dev/c/FvM-qo7BfkI/m/0daqyD8kCQAJ)) would like [a word](https://youtu.be/zCXMh5K5hKQ)); Polymer in particular went through a number of major revisions over the years (1.0 (2015), 2.0 (2017), 3.0 (2018), lit-html (2017), Lit 1.0 (2019), Lit 2.0 (2021), Lit 3.0 (2023)).

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

[Astro components](https://docs.astro.build/en/core-concepts/astro-components/) are essentially server rendered partials using a JSX-like (but more [HTML adjacent](https://docs.astro.build/en/core-concepts/astro-syntax/#differences-between-astro-and-jsx)) templating syntax that is preceded by some preparatory JavaScript (or TypeScript in this case) code in the frontmatter. `todos-view` is the Web Component which is clearly passed some child content. The component starts to manage any relevant parts of the light DOM (i.e. normal DOM, as opposed to [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)) that it contains.

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

Most modern JavaScript is loaded [`async`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#async), [`defer`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer) or [`type="module"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#module), i.e. by the time the document has already been fully parsed. So the Web Component module can be initialized (`todosView.initialize()`) when the bundle entry code is run (so there is no need to deal with [`readyState`, `DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event#checking_whether_loading_is_already_complete)):

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
  customElements.define(
    todosView.NAME,
    todosView.makeClass({
      addTodo: app.addTodo,
      removeTodo: app.removeTodo,
      toggleTodo: app.toggleTodo,
      subscribeTodoEvent: app.subscribeTodoEvent,
    })
  );
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

/** @returns {() => HTMLLIElement} */
function makeCloneBlankItem() {
  const template = document.getElementById(TEMPLATE_ITEM_ID);
  if (!(template instanceof HTMLTemplateElement))
    throw Error(`${TEMPLATE_ITEM_ID} template not found`);

  const root = template.content.firstElementChild;
  if (!(root instanceof HTMLLIElement))
    throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

  return function cloneBlankItem() {
    return /** @type {HTMLLIElement} */ (root.cloneNode(true));
  };
}

// … 

/** @param {{
  *   addTodo: AddTodo;
  *   removeTodo: RemoveTodo;
  *   toggleTodo: ToggleTodo;
  *   subscribeTodoEvent: SubscribeTodoEvent;
  * }} depend
  */
function makeClass({ addTodo, removeTodo, toggleTodo, subscribeTodoEvent }) {
  const cloneBlankItem = makeCloneBlankItem();

  /** @param {HTMLInputElement} title
    */
  async function dispatchAddTodo(title) {
    await addTodo(title.value);
    title.value = '';
  }

  /** @this Binder
    * @param {Event} event
    */
  function handleEvent(event) {
    if (event.type === 'click') {
      if (event.target === this.newTitle) {
        // Add new todo
        event.preventDefault();
        if (this.title.value.length < 1) return;

        dispatchAddTodo(this.title);
        return;
      }

      // Toggle/Remove Todo
      dispatchIntent(toggleTodo, removeTodo, this.items, event.target);
      return;
    }
  }

  class TodosView extends HTMLElement {
    /** @type {Binder | undefined} */
    binder;

    constructor() {
      super();
    }

    connectedCallback() {
      const title = this.querySelector(SELECTOR_TITLE);
      if (!(title instanceof HTMLInputElement))
        throw new Error('Unable to bind to todo "title" input');

      const newTitle = this.querySelector(SELECTOR_NEW);
      if (!(newTitle instanceof HTMLButtonElement))
        throw new Error('Unable to bind to "new" todo button');

      const list = this.querySelector(SELECTOR_LIST);
      if (!(list instanceof HTMLUListElement))
        throw new Error('Unable to bind to todo list');

      /** @type {Binder} */
      const binder = {
        root: this,
        title,
        newTitle,
        list,
        items: fromUL(list),
        handleEvent,
        unsubscribeTodoEvent: undefined,
      };

      binder.unsubscribeTodoEvent = subscribeTodoEvent(
        makeTodoNotify(cloneBlankItem, binder)
      );
      binder.newTitle.addEventListener('click', binder);
      binder.list.addEventListener('click', binder);
      this.binder = binder;
    }

    disconnectedCallback() {
      if (!this.binder) return;

      const binder = this.binder;
      this.binder = undefined;
      binder.list.removeEventListener('click', binder);
      binder.newTitle.removeEventListener('click', binder);
      binder.unsubscribeTodoEvent?.();
    }
  }

  return TodosView;
}

export { NAME, makeClass };
```

### 5. When needed, clone the blank content and “fill in the blanks”. 

Once the `blank` content is cloned, simple selectors can locate the relevant elements in order to fill in the necessary information (here setting the `index` and `id` [data attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) and adding the [`Text`](https://developer.mozilla.org/en-US/docs/Web/API/Text) node with the todo's `title`)).

```TypeScript
// @ts-check
// file: src/components/todos-view.js

// … 

const SELECTOR_LABEL = 'label';
const SELECTOR_CHECKBOX = 'input[type=checkbox]';
const SELECTOR_REMOVE = 'button';

// … 

/**  @param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
  *  @param {Todo} todo
  *  @returns {[root: HTMLLIElement, binder: ItemBinder]}
  */
function fillItem(cloneBlankItem, todo) {
  const root = cloneBlankItem();
  const label = root.querySelector(SELECTOR_LABEL);
  const checkbox = root.querySelector(SELECTOR_CHECKBOX);
  const remove = root.querySelector(SELECTOR_REMOVE);
  if (
    !(
      label instanceof HTMLLabelElement &&
      checkbox instanceof HTMLInputElement &&
      remove instanceof HTMLButtonElement
    )
  )
    throw new Error('Unexpected <li> shape for todo');

  root.dataset['index'] = String(todo.index);
  checkbox.checked = todo.completed;
  label.dataset['id'] = todo.id;
  if (todo.title) label.appendChild(new Text(todo.title));

  const binder = makeItemBinder(root, checkbox, remove, todo.id, todo.index);

  return [root, binder];
}

// … 

/**  @param {ItemCollection} binders
  *  @param {ItemBinder} newBinder
  *  @returns { HTMLLIElement | undefined }
  */
function spliceItemBinder(binders, newBinder) {
  const last = binders.length - 1;
  // Scan collection in reverse bailing on the
  // first index property smaller than the
  // new index property
  // (item binders are in ascending index property order)
  let i = last;
  for (; i > -1; i -= 1) if (binders[i].index < newBinder.index) break;

  if (i < 0) {
    binders[0] = newBinder;
    return undefined;
  }

  const before = binders[i].root;
  if (i === last) {
    binders.push(newBinder);
    return before;
  }

  binders.splice(i, 0, newBinder);
  return before;
}

// … 

/**  @param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
  *  @param {HTMLUListElement} list
  *  @param {ItemCollection} binders
  *  @param {Readonly<Todo>} todo
  */
function addItem(cloneBlankItem, list, binders, todo) {
  const [item, binder] = fillItem(cloneBlankItem, todo);
  const before = spliceItemBinder(binders, binder);
  if (before) {
    before.after(item);
  } else {
    list.prepend(item);
  }
}

// … 
```

### 6. Components don't communicate with each other but only with the client side app.

While this example only has one single Web Component the guideline still applies. The component's responsibilities are limited to delegating UI interactions to the client side application and projecting some client side application events to the UI. Any behaviour is extremely shallow and strictly limited to manipulating the DOM in response to “UI bound events” and converting DOM events to “application bound events” ([Humble Dialog](https://github.com/peerreynders/solid-bookstore-a/blob/main/assets/TheHumbleDialogBox.pdf); rather than [MVC: misunderstood for 37 years](https://paulhammant.com/2015/04/29/mvc-misunderstood-for-37-years/), [MVC past, present and future](https://givan.se/mvc-past-present-and-future/)).

To demonstrate the point the example was further reworked in [factoring out TodoContent](#factoring-out-todocontent) and [factoring out TodoNew](#factoring-out-todonew) to yield the `todo-new` and `todo-list` Web Components. Subsequently:

```JavaScript
// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import { define } from './components/registry';
import * as todoNew from './components/todo-new';
import * as todoContent from './components/todo-content';
import * as todoList from './components/todo-list';

function assembleApp() {
  const actions = makeTodoActions('/api/todos');
  return makeApp({
    addTodo: actions.addTodo,
    removeTodo: actions.removeTodo,
    toggleTodo: actions.toggleTodo,
  });
}

/** @param { ReturnType<typeof makeApp> } app
 *  @returns { void }
 */
function hookupUI(app) {
  const itemContent = todoContent.makeSupport();

  define(todoNew.makeDefinition({
    addTodo: app.addTodo,
    subscribeStatus: app.subscribeStatus,
  }));

  define(todoList.makeDefinition({
    content: {
      render: itemContent.render,
      from: itemContent.fromContent,
      selector: itemContent.selectorRoot,
    },
    removeTodo: app.removeTodo,
    toggleTodo: app.toggleTodo,
    subscribeStatus: app.subscribeStatus,
    subscribeTodoEvent: app.subscribeTodoEvent,
  }));
}

const app = assembleApp();
hookupUI(app);

app.start();
```

The `todo-list` definition is supplied with functions to initiate the removal and toggling of a `todo`. It also gets access to the subscription point for `TodoEvent`s which notifies it when a todo has been successfully removed, toggled or created. It monitors the available `status` so that it can diasable the toggle checkboxes and remove buttons whenever the application isn't ready.

The `todo-new` definition also includes subscription the point for the available `status`; not only does it disable the `c-todo-new__submit` button whenever the application isn't ready but it also activates the spinner (`js:c-todo-new--wait`) specifically for the wait status. It is supplied with the function needed to initiate the creation of a new todo.

### Some Observations (Conclusions)

It needs to be emphasized that with this recipe/approach: 
- components never communicate with one another, only with (parts of) the application
- components never render themselves but only render specific parts within their region of control so
    - component rendering and component behaviour are *separate aspects*
    - a component factory is expected to be injected with its dependencies during the UI definition phase
        - the functions to delegate UI events to the client side application
        - the subscription points (event emitters, signals) to receive updates from the client side application
        - render functions for its nested parts

So the lifecycle of these components is fairly simple:

1. *Something* renders the component's DOM subtree with a segregated render function (or it appears as part of the DOM from the initial HTML parse).
2. The registry runs the component's `connectedCallback()` at which point the instance caches critical DOM references and establishes its connection (subscribes to application events) to the client side application.
3. During the lifetime of the component it delegates UI events to the application and modifies the DOM in response to events/signals from the application. During this time it may render other components within its subtree which may in turn connect to the application themselves.
4. The registry runs the component's `disconnectedCallback()` so the component disconnects (unsubscribes) from the application events and releases any resources that it may have acquired.

Hypothetically a Web Component can go through multiple `connectCallback`/`disconnectCallback` cycles. If that is likely to happen to any particular component then that must be reflected in its design.

One aspect this demonstration doesn't touch on is client side routing. Here `/` simply *is* the todo list (for the particular browser as tracked by the `__session` cookie); new todos are `POST`ed to `/api/todos` and toggles and deletes are `POST`ed to `/api/todos/{id}`.

This suggests the following sequence of events:

1. An UI event is delegated by a component to the application.
2. If the UI event only affects extended state, the application simply makes the necessary *volatile* changes. Extended state is not persisted, nor reconstituted when the client is loaded from the identical URL. Any other UI event will effect a route change. Persisting a new state under the current route is handled like a route change. 
3. Based on the route change the application determines which *additional* data needs to be acquired (or what actions need to be taken).
4. After the *additional* data has been received (or any necessary actions completed), the application will issue any resulting application events to existing components. 
5. Some components will simply update their current contents. Others will render new components, perhaps replacing existing ones.
6. Existing disconnected components will dispose of themselves while new components connect to the client application to receive further updates later.
7. After completing, the UI is ready for the next UI Event (and the application is ready to accept a server side event that will change the UI).

This also suggests a strong coupling between route management and the client side application. (This is why [Michel Weststrate](https://github.com/mweststrate) replaced React Router with [manual routing](https://github.com/mweststrate/react-mobx-shop/blob/react-amsterdam-2017/src/stores/ViewStore.js) in his [React + MobX Bookshop](https://github.com/mweststrate/react-mobx-shop) demo ([presentation](https://youtu.be/3J9EJrvqOiM), [article](https://michel.codes/blogs/ui-as-an-afterthought)).) However a strict separation of the client application from the [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) is desirable from the [microtesting](https://youtu.be/H3LOyuqhaJA) perspective (hence the separation of `app/browser.js` from `app/index.js`).

This demo doesn't really use much of the Web Component API. In fact it doesn't even need that API. The [`qsa-observer` variant](qsa-observer/README.md) (increasing the minified bundle by 1.5 kB) implements exactly the same demo without Web Components using [`qsa-observer`](https://github.com/WebReflection/qsa-observer) which itself is based on [`Mutation Observer`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver). 

But we're really not dealing with components in colloquial sense anymore, are we?
- The definition of the markdown (and CSS rulesets) is now strictly a server concern
- The client components depend on templates under the purview of the server that have to be included on the page otherwise the component can't render any nested components.
- (Whole) component rendering is separate from component behaviour; in fact a component does not render *itself* at all:
    - It “connects” *after* it's DOM subtree is rendered from elsewhere
    - After that it updates when [told](https://media.pragprog.com/articles/jan_03_enbug.pdf) by the application.

Entering [Generation 3](https://igor.dev/posts/experiences-web-frameworks-future-me/#return-to-server) server and client need to work more closely together to deliver better and faster UX. Here Web Components are at a distinct disadvantage because they are firmly stuck in [Generation 2](https://igor.dev/posts/experiences-web-frameworks-future-me/#gen2). Sure, [Lit](https://lit.dev/docs/ssr/overview/) will eventually support SSR but now we are no longer *just using the platform* **and** we are forced to run JS on the server anyway (perhaps with a slow or incomplete server side emulation of DOM).

There is no [one web platform](https://www.quirksmode.org/blog/archives/2015/05/tools_dont_solv.html#:~:text=The%20web%20platforms%2C%20plural) but in fact it's a wide spectrum of innumerable combinations of client device capabilities, network conditions and server platforms/technologies. This has been especially true since [mobile reset everything](https://twitter.com/slightlylate/status/1432072075276083205). 

Faced with a similar situation, needing to maximize the performance yielded from commodity hardware found in gaming consoles in 2009 the gamimg industry started to [move from OO to Data-Oriented Design](https://gamesfromwithin.com/data-oriented-design) and embracing the [Entity, Component, System (ECS)](https://medium.com/ingeniouslysimple/entities-components-and-systems-89c31464240d).

> Object-oriented development is good at providing a human oriented representation of the problem in the source code, but **bad at providing a machine representation of the solution**. It is bad at providing a framework for creating an optimal solution, so the question remains: why are game developers still using object-oriented techniques to develop games? It's possible it's not about better design, but instead, making it easier to change the code. It's common knowledge that game developers are constantly changing code to match the natural evolution of the design of the game, right up until launch. Does object-oriented development provide a good way of making maintenance and modification simpler or safer?
>
> [Data-Oriented Design: Mapping the problem](https://www.dataorienteddesign.com/dodbook/node12.html#SECTION001220000000000000000)

Of course that approach won't work in web development as there is no one machine to run the clients or the servers on. But there should always be serious considerations of what trade offs are being made. Meanwhile the reported developer convenience of React-style components really hasn't resulted in the desired [trickle-down UX](https://infrequently.org/2023/02/the-market-for-lemons/#:~:text=the%20koans%20of-,trickle%2Ddown%20UX,-%E2%80%94%20it%20can) while the cost to UX has been [reported](https://aerotwist.com/blog/react-plus-performance-equals-what/) [again](https://timkadlec.com/remembers/2020-04-21-the-cost-of-javascript-frameworks/#javascript-main-thread-time) and [again](https://css-tricks.com/radeventlistener-a-tale-of-client-side-framework-performance/) (though to some extend the "ecosystem" [is to blame as well](https://twitter.com/dan_abramov/status/1259618524751958016)).

Web development's pre-occupation with **components** could simply be *bad for creating an optimal solution* for client browsers. Browsers were designed for pages, not components. So for an optimal end user experience use all performant browser features to maximum effect. That includes creating DOM from server rendered HTML whenever reasonable rather than running JavaScript to create it and using CSS that is available before JavaScript even has a chance to run, both of which can proceed to parse and layout before or in [parallel](https://developer.chrome.com/blog/inside-browser-part1/) to JavaScript [downloading, parsing and executing](https://medium.com/@addyosmani/the-cost-of-javascript-in-2018-7d8950fbb5d4#0d36). 

From that perspective [components should ideally vanish at run time](https://betterprogramming.pub/the-real-cost-of-ui-components-6d2da4aba205#36a2).

- To be continued

---

## Factoring Out TodoContent

For the sake of demonstration lets factor out the todo item content from `todos-view`. As there is no behaviour associated with the content a Web Component isn't necessary. However we need to render the content separately from the `<li>`:

```Astro
---
// file: src/components/todo-item.astro
import type { Todo } from '../types';

interface Props {
  todo?: Todo;
}

const todo = Astro.props.todo;
const [todoId, title] = todo ? [todo.id, todo.title] : ['', ''];
---

<label class="js:c-todo-content" for={todoId}>{title}</label>
```

The todo's `id` is now stored in the `label`'s [`for` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/for) linking it to the sibling `input`'s `id`. The class name `js:c-todo-content` is also added to make it easy to select the root of the content. As this will be included with the templates, the component has to be able to render a *blank* variant of itself.

The content is removed from `todo-item.astro`:

```Astro
---
// file: src/components/todo-item.astro
import type { Todo } from '../types';

interface Props {
  todo?: Todo;
}

const todo = Astro.props.todo;
const [todoId, index, checked] = todo ?
  [todo.id, String(todo.index), todo.completed ? '' : undefined] :
  ['', '', undefined];
---

<li class="c-todos-view__item" data-index={index}>
  <input type="checkbox" checked={checked} id={todoId} />
  <slot />
  <button>❌</button>
</li>
```

The content has been replaced with a [`slot`](https://docs.astro.build/en/core-concepts/astro-components/#slots). Now `todos-view.astro` is responsible for providing the content:

```Astro
---
// file: src/components/todos-view.astro
import type { Todo } from '../types';
import TodoContent from './todo-content.astro';
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
      name="todo-title"
      type="text"
      placeholder="Add a new to do"
      class="js:c-todos-view__title"
    />
    <button class="js:c-todos-view__new">✅</button>
  </form>
  <ul class="js:c-todos-view__list">
    {
      todoItems.map((todo) => (
        <TodoItem {todo}>
          <TodoContent {todo} />
        </TodoItem>
      ))
    }
  </ul>
</todos-view>
```

The content blank has to be included with the page templates:

```Astro
---
// file: src/templates/main-templates.astro
import TodoItem from '../components/todo-item.astro';
import TodoContent from '../components/todo-content.astro';
---

<template id="template-todo-item">
  <TodoItem />
</template>
<template id="template-todo-content">
  <TodoContent />
</template>
```

The client side module creates the support capabilities that `todos-view` can delegate to:

```JavaScript
// @ts-check
// file: src/client/components/todo-content.js

/** @typedef {import('../index').Todo} Todo */

const NAME = 'todo-content';
const TEMPLATE_CONTENT_ID = 'template-todo-content';
const SELECTOR_ROOT = '.js\\:c-todo-content';

/** @returns {() => HTMLLabelElement} */
function makeCloneContent() {
  const template = document.getElementById(TEMPLATE_CONTENT_ID);
  if (!(template instanceof HTMLTemplateElement))
    throw Error(`${TEMPLATE_CONTENT_ID} template not found`);

  const root = template.content.firstElementChild;
  if (!(root instanceof HTMLLabelElement))
    throw new Error(`Unexpected ${TEMPLATE_CONTENT_ID} template root`);

  return function cloneContent() {
    return /** @type {HTMLLabelElement} */ (root.cloneNode(true));
  };
}

/** @param {ReturnType<typeof makeCloneContent>} cloneContent
 *  @param {Todo} todo
 *  @returns {HTMLLabelElement}
 */
function fillContent(cloneContent, todo) {
  const root = cloneContent();

  root.htmlFor = todo.id;
  if (todo.title) root.appendChild(new Text(todo.title));

  return root;
}

/** @type {import('../types').FromTodoContent} */
function fromContent(root) {
  if (!(root instanceof HTMLLabelElement)) return [];

  const id = root.htmlFor ?? '';
  if (id.length < 1) return [];

  const text = root.lastChild;
  const title = text && text instanceof Text ? text.nodeValue ?? '' : '';

  return [id, title];
}

// There is no behavior associated with this content
// so a Web Component isn't necessary
//

function makeSupport() {
  const cloneContent = makeCloneContent();
  /** @type {(todo: Todo) => HTMLElement} */
  const render = (todo) => fillContent(cloneContent, todo);

  return {
    render,
    fromContent,
  };
}

export { NAME, SELECTOR_ROOT, makeSupport };
```

`SELECTOR_ROOT` is exported to make it easier for `todos-view` to locate the content inside a `<li>` when it needs to extract information from it. `fromContent()` can then extract the todo's ID and title when it is given the content root. `makeSupport()` returns an object with `fromContent` and `render`. `makeSupport()` gives the entry script control *when* the support functions are created. In this case `makeSupport()` should only be called once the DOM has been fully parsed as `makeCloneContent` accesses the `template-todo-content` from the page.

The entry script is responsible for injecting the support functions into `todos-view`:

```JavaScript
// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import * as todoContent from './components/todo-content';
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
 *  @returns { void }
 */
function hookupUI(app) {
  const itemSupport = todoContent.makeSupport();

  customElements.define(
    todosView.NAME,
    todosView.makeClass({
      content: {
        render: itemSupport.render,
        from: itemSupport.fromContent,
        selector: todoContent.SELECTOR_ROOT,
      },
      addTodo: app.addTodo,
      removeTodo: app.removeTodo,
      toggleTodo: app.toggleTodo,
      subscribeTodoEvent: app.subscribeTodoEvent,
    })
  );
}

hookupUI(assembleApp());
```

The new `content` object provides `todos-view` with the tools to
- find the content in a `<li>` (`content.selector`)
- extract the `id` and `title` from the content (`content.from`)
- render the content from a `todo` (`content.render`)

This leads the  following updates:

```JavaScript
// file: src/components/todos-view.js

// … 

/** @param {FromTodoContent} fromContent
 *  @param {string} contentSelector
 *  @param {HTMLUListElement} list
 *  @returns {ItemCollection}
 */
function fromUL(fromContent, contentSelector, list) {
  const items = list.children;

  /** @type {ItemCollection} */
  const binders = [];
  for (let i = 0; i < items.length; i += 1) {
    const root = items.item(i);
    if (!(root instanceof HTMLLIElement)) continue;

    const content = root.querySelector(contentSelector);
    if (!(content instanceof HTMLElement)) continue;

    const [id] = fromContent(content);
    if (id === undefined) continue;

    const value = root.dataset['index'];
    const index = value ? parseInt(value, 10) : NaN;
    if (Number.isNaN(index)) continue;

    const completed = root.querySelector(SELECTOR_CHECKBOX);
    if (!(completed instanceof HTMLInputElement)) continue;

    const remove = root.querySelector(SELECTOR_REMOVE);
    if (!(remove instanceof HTMLButtonElement)) continue;

    binders.push(makeItemBinder(root, completed, remove, id, index));
  }

  return binders.sort(byIndexAsc);
}
```

`fromUL()` is passed `contentSelector` to help find the selector root and `fromContent` to extract the information from it.

```JavaScript
// file: src/components/todos-view.js

// … 

/** @param {ReturnType<typeof makeCloneBlankItem>} cloneBlankItem
 *  @param {TodoRender} contentRender
 *  @param {Todo} todo
 *  @returns {[root: HTMLLIElement, binder: ItemBinder]}
 */
function fillItem(cloneBlankItem, contentRender, todo) {
  const root = cloneBlankItem();
  const checkbox = root.querySelector(SELECTOR_CHECKBOX);
  const remove = root.querySelector(SELECTOR_REMOVE);
  if (
    !(
      checkbox instanceof HTMLInputElement &&
      remove instanceof HTMLButtonElement
    )
  )
    throw new Error('Unexpected <li> shape for todo');

  const content = contentRender(todo);

  root.dataset['index'] = String(todo.index);
  checkbox.checked = todo.completed;
  checkbox.id = todo.id;
  remove.before(content);

  const binder = makeItemBinder(root, checkbox, remove, todo.id, todo.index);

  return [root, binder];
}

```
`fillItem()` is passed `contentRender` to render the content right [`before`](https://developer.mozilla.org/en-US/docs/Web/API/Element/before) the remove button.

## Factoring Out TodoNew

The first step is to extract `TodoNew` from `TodosView`. In this circumstance `TodoNew` doesn't render anything client side but in order to clearly demarcate the boundaries the `todo-new` Astro component is extracted:

```Astro
---
// file: src/components/todo-new.astro
---

<form is="todo-new">
  <input
    name="todo-title"
    type="text"
    placeholder="Add a new to do"
    class="js:c-todo-new__title"
  />
  <button class="js:c-todo-new__submit">✅</button>
</form>
```

While not strictly necessary we'll make this a [customized built-in element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#types_of_custom_element) so that we can just use the [`is` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/is) on the `<form>` tag. But this also implies that it won't work on Safari without basing the Web Component on a [ponyfill](https://ponyfoo.com/articles/polyfills-or-ponyfills) (like [`builtin-elements`](https://github.com/WebReflection/builtin-elements)). As we are not accessing anything specific to [`HTMLFormElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement) inside the Web Component, `TodoNew` can be just as easily implemented with an autonomous custom element by wrapping the markup in a `<todo-new>` tag.

The next step is to add the new responsibility to `TodoNew` which first requires a refinement of the app interface.

Updating the `TodoView` Astro component to use `TodoNew`:

```Astro
---
// file: src/components/todos-view.astro
import type { Todo } from '../types';
import TodoNew from './todo-new.astro';
import TodoContent from './todo-content.astro';
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
  <TodoNew />
  <ul class="js:c-todos-view__list">
    {
      todoItems.map((todo) => (
        <TodoItem {todo}>
          <TodoContent {todo} />
        </TodoItem>
      ))
    }
  </ul>
</todos-view>
```

On the client side the relevant capabilties are moved to `todo-new.js`:

```JavaScript
// @ts-check
// file: src/client/components/todo-new.js

/** @typedef {import('../app').AddTodo} AddTodo */

const NAME = 'todo-new';
const SELECTOR_TITLE = '.js\\:c-todo-new__title';
const SELECTOR_NEW = '.js\\:c-todo-new__submit';

/** @typedef {object} Binder
 *  @property {HTMLFormElement} root
 *  @property {HTMLInputElement} title
 *  @property {HTMLButtonElement} submit
 *  @property {(this: Binder, event: Event) => void} handleEvent
 */

/** @param {{
 *   addTodo: AddTodo
 * }} dependencies
 */
function makeDefinition({ addTodo }) {
  /**  @param {HTMLInputElement} title
   */
  async function dispatchAddTodo(title) {
    await addTodo(title.value);
    title.value = '';
  }

  /** @this Binder
   *  @param {Event} event
   */
  function handleEvent(event) {
    if (event.type === 'click' && event.target === this.submit) {
      event.preventDefault();
      if (this.title.value.length < 1) return;

      dispatchAddTodo(this.title);
      return;
    }
  }

  class TodoNew extends HTMLFormElement {
    /** @type {Binder | undefined} */
    binder;

    constructor() {
      super();
    }

    connectedCallback() {
      const title = this.querySelector(SELECTOR_TITLE);
      if (!(title instanceof HTMLInputElement))
        throw new Error('Unable to bind to "title" input');

      const submit = this.querySelector(SELECTOR_NEW);
      if (!(submit instanceof HTMLButtonElement))
        throw new Error('Unable to bind to submit button');

      /** @type {Binder} */
      const binder = {
        root: this,
        title,
        submit,
        handleEvent,
      };
      binder.submit.addEventListener('click', binder);
      this.binder = binder;
    }

    disconnectedCallback() {
      if (!this.binder) return;

      const binder = this.binder;
      this.binder = undefined;
      binder.submit.removeEventListener('click', binder);
    }
  }

  return {
    name: NAME,
    constructor: TodoNew,
    options: { extends: 'form' },
  };
}

export { makeDefinition };
```

… so it can be removed from `TodosView`:

```JavaScript
// file: src/components/todos-view.js

// … 

/**  @param {{
 *    content: {
 *      render: TodoRender;
 *      from: FromTodoContent;
 *      selector: string;
 *    };
 *    removeTodo: RemoveTodo;
 *    toggleTodo: ToggleTodo;
 *    subscribeTodoEvent: SubscribeTodoEvent;
 *  }} dependencies
 */
function makeDefinition({
  content,
  removeTodo,
  toggleTodo,
  subscribeTodoEvent,
}) {
  const cloneBlankItem = makeCloneBlankItem();

  /** @this Binder
   *  @param {Event} event
   */
  function handleEvent(event) {
    if (event.type === 'click') {
      // Toggle/Remove Todo
      dispatchIntent(toggleTodo, removeTodo, this.items, event.target);
      return;
    }
  }

  class TodosView extends HTMLElement {
    /** @type {Binder | undefined} */
    binder;

    constructor() {
      super();
    }

    connectedCallback() {
      const list = this.querySelector(SELECTOR_LIST);
      if (!(list instanceof HTMLUListElement))
        throw new Error('Unable to bind to todo list');

      /** @type {Binder} */
      const binder = {
        root: this,
        list,
        items: fromUL(content.from, content.selector, list),
        handleEvent,
        unsubscribeTodoEvent: undefined,
      };

      binder.unsubscribeTodoEvent = subscribeTodoEvent(
        makeTodoNotify(cloneBlankItem, content.render, binder)
      );
      binder.list.addEventListener('click', binder);
      this.binder = binder;
    }

    disconnectedCallback() {
      if (!this.binder) return;

      const binder = this.binder;
      this.binder = undefined;
      binder.list.removeEventListener('click', binder);
      binder.unsubscribeTodoEvent?.();
    }
  }

  return {
    name: NAME,
    constructor: TodosView,
  };
}

// … 
```

Note how `makeDefinition()` no longer needs access to the `addTodo()` dispatch from app. Making the necessary adjustments in the entry point:

```JavaScript
// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import { define } from './components/registry';
import * as todoNew from './components/todo-new';
import * as todoContent from './components/todo-content';
import * as todosView from './components/todos-view';

function assembleApp() {
  const actions = makeTodoActions('/api/todos');
  return makeApp({
    addTodo: actions.addTodo,
    removeTodo: actions.removeTodo,
    toggleTodo: actions.toggleTodo,
  });
}

/**  @param { ReturnType<typeof makeApp> } app
 *  @returns { void }
 */
function hookupUI(app) {
  const itemContent = todoContent.makeSupport();

  define(todoNew.makeDefinition({
    addTodo: app.addTodo,
  }));

  define(todosView.makeDefinition({
    content: {
      render: itemContent.render,
      from: itemContent.fromContent,
      selector: itemContent.selectorRoot,
    },
    removeTodo: app.removeTodo,
    toggleTodo: app.toggleTodo,
    subscribeTodoEvent: app.subscribeTodoEvent,
  }));
}

hookupUI(assembleApp());
```

Now `addTodo` is injected into `TodoNew`. Note how `TodosView` and `TodoNew` are not coupled to one another but rather to the API contract of the app.

As at this point `TodosView` no longer manages new todos; it's responsibility (and scope of control) are better described by `TodoList`. Going forward these are the objectives:

- turn `todos-view` into `todo-list`
- add the responsibility of the wait/busy indicator to `todo-new`
- render both the `TodoList` and `TodoNew` Astro components in `disabled` mode (to only be activated client side)
- add an `AvailableStatus` to the client side app that client components can subscribe to
- modify `TodoNew` and `TodoList` to subscribe to the `AvailableStatus`

Starting on the server side:

```Astro
---
// file: src/components/todo-new.astro
---

<form is="todo-new">
  <input
    name="todo-title"
    type="text"
    placeholder="Add a new to do"
    class="js:c-todo-new__title js:c-todo-new--disabled"
  />
  <button
    class="c-todo-new__submit js:c-todo-new__submit js:c-todo-new--disabled"
    aria-disabled="true">✅</button
  >
</form>
```

`TodoNew` has all the modifications for the component to start up in *disabled* mode until the client side app signals a `ready` `AvailableStatus`.

```Astro
---
// file: src/components/todo-item.astro
import type { Todo } from '../types';

interface Props {
  todo?: Todo;
}

const todo = Astro.props.todo;
const [todoId, index, checked, disabled] = todo
  ? [
      todo.id,
      String(todo.index),
      todo.completed ? 'checked' : undefined,
      'disabled',
    ]
  : ['', '', undefined, undefined];
---

<li class="c-todo-list__item" data-index={index}>
  <input type="checkbox" {checked} id={todoId} {disabled} />
  <slot />
  <button aria-disabled="true"}>❌</button>
</li>
```

`TodoItem` renders `disabled` for server side rendering and enabled for the inclusion as a template.

Note: Using a dynamic `aria-disabled` attribute on the `<button>` results in a `'{ "aria-disabled": string; }' is not assignable to type 'ButtonHTMLAttributes'.` TypeScript error, likely because the [`disabled`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/disabled) property is directly supported. There are however [reasons](https://css-tricks.com/making-disabled-buttons-more-inclusive/) to favour `aria-disabled` over `disabled` on buttons. As a workaround a static `aria-disabled="true"` (appropriate for server side rendering) is used which is later corrected in the template client side. 

```Astro
---
// file: src/components/todo-list.astro
import type { Todo } from '../types';
import TodoContent from './todo-content.astro';
import TodoItem from './todo-item.astro';

interface Props {
  todos: Todo[];
}

const { todos } = Astro.props;
---

<ul
  is="todo-list"
  class="js:c-todo-list--disabled"
  aria-disabled="true"
>
  {
    todos.map((todo) => (
      <TodoItem {todo}>
        <TodoContent {todo} />
      </TodoItem>
    ))
  }
</ul>
```

Again a *customized built-in element* is used just to dispense with the wrapping `<todo-list>` tag and it is rendered as its `disabled` variant.

```Astro
---
// file: src/pages/index.astro
import Base from '../layouts/base.astro';
import MainTemplates from '../templates/main-templates.astro';
import TodoNew from '../components/todo-new.astro';
import TodoList from '../components/todo-list.astro';
import { selectTodos } from './todos-store';

const todos = await selectTodos(Astro.locals.sessionId);
const title = `Astro "WC: zero to hero" Todos`;
---

<Base {title}>
  <main>
    <h3>{title}</h3>
    <br />
    <h1>To do</h1>
    <TodoNew />
    <TodoList {todos} />
  </main>
  <MainTemplates />
  {
    /* <script is:inline id="resume-data" type="application/json" set:html={JSON.stringify(todos)} /> */
  }
</Base>
```

The headings are now just static parts of the page while the `TodoNew` and `TodoList` Astro components are responsible for rendering the component content that will allow them to correctly mount.

Currently todo `new`, `toggle`, and `update` happen too quickly on `localhost`:

```TypeScript
// file: src/lib/delay.ts

function makeDelay<T>(ms = 300) {
  return function delay(value: T) {
    return ms < 1
      ? value
      : new Promise((resolve, _reject) => {
          setTimeout(() => resolve(value), ms);
        });
  };
}

export { makeDelay };
```

This function creates an identity function that delays its input by the specified milliseconds.

```TypeScript
// file: src/pages/api/todos/index.ts
import { makeDelay } from '../../../lib/delay';

// … 
  const todo = await appendTodo(context.locals.sessionId, title).then(
    makeDelay()
  );
// … 
```

```TypeScript
// file: src/pages/api/todos/[id].ts
import { makeDelay } from '../../../lib/delay';

// … 
  if (intent === 'remove')
    return remove(context.locals.sessionId, todoId).then(makeDelay());

  // Optional `force` field
  const force = data.get('force');
  return toggle(
    context.locals.sessionId,
    todoId,
    force === 'true' ? true : force === 'false' ? false : undefined
  ).then(makeDelay());
// … 
```

On the client side the app needs to publish `AvailableStatus`:

```JavaScript
// @ts-check

const availableStatus = /** @type {const} */ ({
  UNAVAILABLE: -1,
  WAIT: 0,
  READY: 1,
});

export { availableStatus };
```

```JavaScript
// @ts-check
// file: src/client/app/index.js
import { availableStatus } from './available-status';
import { Multicast } from '../lib/multicast.js';

/** @typedef {import('../index').Todo} Todo */

// Types implemented for UI
/** @typedef {import('../app').AvailableStatus} AvailableStatus */
/** @typedef {import('../app').SubscribeStatus} SubscribeStatus */
/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').RemoveTodo} RemoveTodo */
/** @typedef {import('../app').ToggleTodo} ToggleTodo */

/** @typedef {object} Platform
 * @property {import('./types').AddTodo} addTodo
 * @property {import('./types').RemoveTodo} removeTodo
 * @property {import('./types').ToggleTodo} toggleTodo
 */

/** @param { Platform } platform
 */
function makeApp(platform) {
  /** @type {AvailableStatus} */
  let status = availableStatus.UNAVAILABLE;
  /** @type {Multicast<import('../app').AvailableStatus>} */
  const available = new Multicast();

  /** @type {SubscribeStatus} */
  const subscribeStatus = (sink) => {
    const unsubscribe = available.add(sink);
    sink(status);
    return unsubscribe;
  };

  const readyStatus = () => {
    status = availableStatus.READY;
    available.send(status);
  };
  const waitStatus = () => {
    status = availableStatus.WAIT;
    available.send(status);
  };

  /** @type {Multicast<import('../app').TodoEvent>} */
  const todoEvents = new Multicast();

  /** @type { AddTodo } */
  const addTodo = async (title) => {
    waitStatus();
    try {
      const todo = await platform.addTodo(title);
      todoEvents.send({ kind: 'todo-new', todo });
    } finally {
      readyStatus();
    }
  };

  /** @type { RemoveTodo } */
  const removeTodo = async (id) => {
    waitStatus();
    try {
      const removed = await platform.removeTodo(id);
      if (!removed) return;

      todoEvents.send({ kind: 'todo-remove', id });
    } finally {
      readyStatus();
    }
  };

  /** @type { ToggleTodo } */
  const toggleTodo = async (id, force) => {
    waitStatus();
    try {
      const todo = await platform.toggleTodo(id, force);
      todoEvents.send({ kind: 'todo-toggle', id, completed: todo.completed });
    } finally {
      readyStatus();
    }
  };

  const start = () => {
    if (status !== availableStatus.UNAVAILABLE) return;
    readyStatus();
  };

  return {
    addTodo,
    removeTodo,
    toggleTodo,
    start,
    subscribeTodoEvent: todoEvents.add,
    subscribeStatus,
  };
}

export { makeApp };
```

The app's `AvailableStatus` is initialized to `UNAVAILABLE` and isn't advanced to `READY` until `start()` is run. This way none of the components will receive the `READY` status until all the necessary functionality has been wired up. `subscribeStatus` wraps `Multicast.add()` by immediately sending the current `status` to the newly registered `sink`. The convenience functions `readyStatus()` and `waitStatus()` set the `status` and broadcast the change to the listeners.

`addTodo()`, `removeTodo()`, and `toggleTodo` now start by switching to `WAIT` and not going back the `READY` until the asynchronous operation completes. `readyStatus()` is invoked inside of a [`finally` block](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch#the_finally_block) in case the operation throws an exception (which may not be warranted in some cases).

Both `start` and `subscribeStatus` are added to the returned API object.

```JavaScript
// @ts-check
// file: src/client/entry.js
import { makeTodoActions } from './app/browser';
import { makeApp } from './app/index';
import { define } from './components/registry';
import * as todoNew from './components/todo-new';
import * as todoContent from './components/todo-content';
import * as todoList from './components/todo-list';

function assembleApp() {
  const actions = makeTodoActions('/api/todos');
  return makeApp({
    addTodo: actions.addTodo,
    removeTodo: actions.removeTodo,
    toggleTodo: actions.toggleTodo,
  });
}

/**  @param { ReturnType<typeof makeApp> } app
 *  @returns { void }
 */
function hookupUI(app) {
  const itemContent = todoContent.makeSupport();

  define(todoNew.makeDefinition({
    addTodo: app.addTodo,
    subscribeStatus: app.subscribeStatus,
  }));

  define(todoList.makeDefinition({
    content: {
      render: itemContent.render,
      from: itemContent.fromContent,
      selector: itemContent.selectorRoot,
    },
    removeTodo: app.removeTodo,
    toggleTodo: app.toggleTodo,
    subscribeStatus: app.subscribeStatus,
    subscribeTodoEvent: app.subscribeTodoEvent,
  }));
}

const app = assembleApp();
hookupUI(app);

app.start();
```

`hookupUI()` supplies both `TodoNew` and `TodoList` with the `subscribeStatus()` access and finally invokes `app.start()` when everything is wired up.

```JavaScript
// @ts-check
// file: src/client/components/todo-new.js
import { availableStatus } from '../app/available-status';

/** @typedef {import('../app').AddTodo} AddTodo */
/** @typedef {import('../app').AvailableStatus} AvailableStatus */
/** @typedef {import('../app').SubscribeStatus} SubscribeStatus */

const NAME = 'todo-new';
const SELECTOR_TITLE = '.js\\:c-todo-new__title';
const SELECTOR_NEW = '.js\\:c-todo-new__submit';
const MODIFIER_DISABLED = 'js:c-todo-new--disabled';
const MODIFIER_WAIT = 'js:c-todo-new--wait';

/** @typedef {object} Binder
 *  @property {HTMLFormElement} root
 *  @property {HTMLInputElement} title
 *  @property {HTMLButtonElement} submit
 *  @property {boolean} disabled
 *  @property {(this: Binder, event: Event) => void} handleEvent
 *  @property {(() => void) | undefined} unsubscribeStatus
 */

/** @param {Binder} binder
 * @param {AvailableStatus} status
 */
function onAvailable(binder, status) {
  const [disabled, wait] =
    status === availableStatus.READY
      ? [false, false]
      : status === availableStatus.WAIT
      ? [true, true]
      : [true, false];

  binder.submit.classList.toggle(MODIFIER_WAIT, wait);

  binder.disabled = disabled;
  binder.submit.classList.toggle(MODIFIER_DISABLED, disabled);
  binder.submit.setAttribute('aria-disabled', String(disabled));
  binder.title.classList.toggle(MODIFIER_DISABLED, disabled);
}

/** @param {{
 *   addTodo: AddTodo;
 *   subscribeStatus: SubscribeStatus;
 * }} dependencies
 */
function makeDefinition({ addTodo, subscribeStatus }) {
  
  // … 

  class TodoNew extends HTMLFormElement {
    /** @type {Binder | undefined} */
    binder;

    constructor() {
      super();
    }

    connectedCallback() {
      // … 

      /** @type {Binder} */
      const binder = {
        root: this,
        title,
        submit,
        disabled: submit.classList.contains(MODIFIER_DISABLED),
        handleEvent,
        unsubscribeStatus: undefined,
      };
      binder.submit.addEventListener('click', binder);
      binder.unsubscribeStatus = subscribeStatus((status) =>
        onAvailable(binder, status)
      );

      this.binder = binder;
    }

    disconnectedCallback() {
      if (!this.binder) return;

      const binder = this.binder;
      this.binder = undefined;
      binder.submit.removeEventListener('click', binder);
      binder.unsubscribeStatus?.();
    }
  }

  return {
    name: NAME,
    constructor: TodoNew,
    options: { extends: 'form' },
  };
}

export { makeDefinition };
```

In `onAvailable` both `UNAVAILABLE` and `WAIT` result in *disabled* but only `WAIT` results in *wait* (which activates the spinner). The presence of `MODIFIER_DISABLED` on the remove button's `classList` is used to initialize the new `disabled` property on `Binder`.  

```JavaScript
// @ts-check
// file: src/client/components/todo-list.js
import { availableStatus } from '../app/available-status';

// … 

/** @returns {() => HTMLLIElement} */
function makeCloneBlankItem() {
  const template = document.getElementById(TEMPLATE_ITEM_ID);
  if (!(template instanceof HTMLTemplateElement))
    throw Error(`${TEMPLATE_ITEM_ID} template not found`);

  const root = template.content.firstElementChild;
  if (!(root instanceof HTMLLIElement))
    throw new Error(`Unexpected ${TEMPLATE_ITEM_ID} template root`);

  // Turn off aria-disabled
  const element = root.querySelector('[aria-disabled="true"]');
  if (element) element.setAttribute('aria-disabled', 'false');

  return function cloneBlankItem() {
    return /** @type {HTMLLIElement} */ (root.cloneNode(true));
  };
}

// … 

/** @typedef {object} Binder
 *  @property {HTMLUListElement} root
 *  @property {boolean} disabled
 *  @property {ItemCollection} items
 *  @property {(this: Binder, event: Event) => void} handleEvent
 *  @property {(() => void) | undefined} unsubscribeStatus
 *  @property {(() => void) | undefined} unsubscribeTodoEvent
 */

// … 

/** @param {Binder} binder
 * @param {AvailableStatus} status
 */
function onAvailable(binder, status) {
  const disabled = status !== availableStatus.READY;
  const value = disabled ? 'true' : 'false';
  binder.disabled = disabled;
  binder.root.classList.toggle(MODIFIER_DISABLED, disabled);
  binder.root.setAttribute('aria-disabled', value);

  for (let i = 0; i < binder.items.length; i += 1) {
    const item = binder.items[i];
    item.completed.disabled = disabled;
    item.remove.setAttribute('aria-disabled', value);
  }
}

/**  @param {{
 *    content: {
 *      render: TodoRender;
 *      from: FromTodoContent;
 *      selector: string;
 *    };
 *    removeTodo: RemoveTodo;
 *    toggleTodo: ToggleTodo;
 *    subscribeStatus: SubscribeStatus;
 *    subscribeTodoEvent: SubscribeTodoEvent;
 *  }} dependencies
 */
function makeDefinition({
  content,
  removeTodo,
  toggleTodo,
  subscribeStatus,
  subscribeTodoEvent,
}) {
  const cloneBlankItem = makeCloneBlankItem();

  /** @this Binder
   *  @param {Event} event
   */
  function handleEvent(event) {
    if (this.disabled) return;

    if (event.type === 'click') {
      // Toggle/Remove Todo
      dispatchIntent(toggleTodo, removeTodo, this.items, event.target);
      return;
    }
  }

  class TodoList extends HTMLUListElement {
    /** @type {Binder | undefined} */
    binder;

    constructor() {
      super();
    }

    connectedCallback() {
      /** @type {Binder} */
      const binder = {
        root: this,
        disabled: this.classList.contains(MODIFIER_DISABLED),
        items: fromUL(content.from, content.selector, this),
        handleEvent,
        unsubscribeStatus: undefined,
        unsubscribeTodoEvent: undefined,
      };

      binder.unsubscribeStatus = subscribeStatus((status) =>
        onAvailable(binder, status)
      );
      binder.unsubscribeTodoEvent = subscribeTodoEvent(
        makeTodoNotify(cloneBlankItem, content.render, binder)
      );
      this.addEventListener('click', binder);
      this.binder = binder;
    }

    disconnectedCallback() {
      if (!this.binder) return;

      const binder = this.binder;
      this.binder = undefined;
      binder.root.removeEventListener('click', binder);
      binder.unsubscribeStatus?.();
      binder.unsubscribeTodoEvent?.();
    }
  }

  return {
    name: NAME,
    constructor: TodoList,
    options: { extends: 'ul' },
  };
}

export { makeDefinition };
``` 

For `TodoList` note how `makeCloneBlankItem()` corrects the `aria-disabled` value for the remove button. The `disabled` property is stored on `TodoList`'s `Binder`. `onAvailable()` only concerns itself with *disabled* (not *wait*) and sets the list items functionality accordingly. `handleEvent()` now discards events that are received in the *disabled* state and the initial *disabled* state is derived from the presence of `MODIFIER_DISABLED` on the `<ul>` `classList`.  

## Some Thoughts on the Original Example

From a [recent article](https://adactio.com/journal/20618):

> HTML web components encourage a mindset of augmentation instead.

This is about [progressive enhancement](https://alistapart.com/article/understandingprogressiveenhancement/), i.e. rendering HTML on the server, letting the browser build the DOM without JS and then handing the completed DOM over to JavaScript *to augment*. A more appropriate name for *progressively enhanced elements* would have been [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)—a term already reserved to distinguish between *customized built-in elements* and *autonomous custom elements*.

Customized build-in elements are the closest to the notion of *progressively enhanced elements* but [WebKit has no intent on supporting them](https://github.com/WebKit/standards-positions/issues/97) (though this can be mitigated with [`builtin-elements`](https://github.com/WebReflection/builtin-elements)).

This is perhaps why Web Component tutorials primarily focus on *autonomous custom elements*. Consequently Web Component tutorials (and proponents) seem to focus on using *autonomous custom elements* for implementing fully client-side rendered UI components, serving as an alternative to [framework components](https://docs.astro.build/en/core-concepts/framework-components/).

However:

> [Rich Harris](https://medium.com/@Rich_Harris), the author of Svelte, made the claim that “Frameworks aren’t there to organize your code, but to organize your mind”. **I feel this way about Components**. There are always going to be boundaries and modules to package up to keep code encapsulated and re-usable. **Those boundaries are always going to have a cost, so I believe we are best served to optimize for those boundaries rather than introducing our own*

Source: [The Real Cost of UI Components (2019)](https://betterprogramming.pub/the-real-cost-of-ui-components-6d2da4aba205#36a2)

- Browsers load pages, not components (i.e. browsers don't benefit from components, while being incredibly efficient at transforming HTML to a DOM-tree and styling the page based on [CSS rulesets](https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax#css_rulesets)).
- Natural boundaries of visual design, DOM subtrees, and application capability units don't necessarily coincide. Typical UI component boundaries may be *convenient* in terms collocation but often encompass too many responsibilities making them too coarse-grained to be [cohesive](https://vanderburg.org/blog/2011/01/31/cohesion.html); other times UI component boundaries are too fine-grained, leading to [inappropriate intimacy](https://wiki.c2.com/?InappropriateIntimacy). 
- Proximity of entities within the UI tree doesn't necessarily correlate with the necessary entity communication patterns. 

I.e. component-orientation is largely about developer convenience and enabling [speculative reuse](https://blog.codinghorror.com/rule-of-three/) rather than producing a high (UX) value end product.

From the HTML specification [4.4.6 The `ul` element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element):

> [**Content model**](https://html.spec.whatwg.org/multipage/dom.html#concept-element-content-model):
> - Zero or more [`li`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element) and [script-supporting](https://html.spec.whatwg.org/multipage/dom.html#script-supporting-elements-2) elements.

and [4.4.8 The `li` element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element):

> [Contexts in which this element can be used](https://html.spec.whatwg.org/multipage/dom.html#concept-element-contexts):
> - Inside [`ol`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ol-element) elements.
> - Inside [`ul`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element) elements.
> - Inside [`menu`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-menu-element) elements. 

i.e. the `<li>` tags should be direct children to the `<ul>` tag.

Inspecting the resulting DOM tree one finds that the `<ul>` element's direct children aren't `<li>` elements but `<to-do-item>` elements which later in their [`shadowroot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot) contain the `<li>` element. This could be avoided with *customized built-in elements* and the [`is` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/is) (… but [Safari](https://caniuse.com/custom-elementsv1); [ponyfill](https://github.com/WebReflection/builtin-elements)). But technically there never was any HTML involved in the first place because everything was created by the Web Components JavaScript.

However the phrasing of the HTML spec strongly suggests that the `<li>` element is *tighly coupled* to the list that contains it. So in terms of *boundaries* the list and its items should be managed by the same entity; it's only the content of the `<li>` that may need to be managed separately; of the content the completed checkbox and remove button still belong to list management. So the `<label>` containing the todo title is the only item content left (without any behaviour/interactivity). Given the coupling in the names (`to-do-app`, `to-do-item`) I decided to just collapse the two into `todos-view` (though later: [Factoring Out TodoContent](#factoring-out-todocontent)).

A component that could be factored out is a "new todo input" which could also double as a busy indicator (see: [Factoring Out TodoNew](#factoring-out-todonew)). This way `todo-view` could focus on removing unwanted items from the list, adding new items (arriving from the server) to the list and (un)completing existing items.

## More Thoughts on Web Components

So what are Web Components good for? When including [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) 
and [declarative shadow DOM](https://developer.chrome.com/articles/declarative-shadow-dom/) it's suggestive of “[`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) Enterprise Edition”, i.e. a more refined means for deploying third party content (mostly ads) to be included in affilated content sites/applications.

Built-in custom elements are extremely useful to augment existing HTML elements but [WebKit's position](https://github.com/WebKit/standards-positions/issues/97) makes it necessary to base those on a [ponyfill](https://github.com/WebReflection/builtin-elements).

I really, really wanted to like Web Components, being *part of the platform* and all. Started with [HowTo Components](https://web.dev/articles/components-examples-overview) (2017, [repo](https://github.com/GoogleChromeLabs/howto-components), [some explainers](https://github.com/google/WebFundamentals/tree/1c1d9a95c835c78b6a7497cfce0ce92e77aa8ac8/src/content/en/fundamentals/web-components/examples)) and continued with the [Web Components in Action](https://www.manning.com/books/web-components-in-action) MEAP (2019, gists: [1](https://gist.github.com/peerreynders/937193d5d043ca63289ff93d52842571), [2](https://gist.github.com/peerreynders/c44d3bd373340d0f21fbe50435e41108), [3](https://gist.github.com/peerreynders/084079c213e9da2abfcbd613fdeb6abc), [4](https://gist.github.com/peerreynders/1d4396fa6eb67daac706969a6389a9ca), [5](https://gist.github.com/peerreynders/33c98ffb7b35bd9aeaed524332bf640a), [6](https://gist.github.com/peerreynders/f7253c42332a048539f892be747bc767)). At least by the end of WCA there was a suggestion of using an [`eventbus`](https://github.com/bengfarrell/webcomponentsinaction/blob/0f165a068b4ebbd37d2756920d0228aecb77f1bf/chapter14/workoutcreator/data/eventbus.js) to enable communication patterns among a page's Web Components that weren't coupled to their position in the DOM tree or whatever other Web Component happend to create its instance (and by extension its attributes). However it was still fully immersed in the SPA mindset of [full on client-side rendering](https://github.com/bengfarrell/webcomponentsinaction/blob/0f165a068b4ebbd37d2756920d0228aecb77f1bf/chapter14/workoutcreator/index.html).

It was during this time that [Andy Bell](https://andy-bell.co.uk/links/) suggested in [*A progressive disclosure component*](https://piccalil.li/tutorial/a-progressive-disclosure-component/#heading-going-one-step-further:-a-web-component) that a Web Component could simply take responsibility of the existing *light DOM* tree under it. [Heydon Pickering](https://heydonworks.com/) expanded on it later in [Eschewing Shadow DOM](https://every-layout.dev/blog/eschewing-shadow-dom/).

The history of Web Components goes back to [2011](https://fronteers.nl/congres/2011/sessions/web-components-and-model-driven-views-alex-russell) and then the CSR focus was understandable given that web servers were often slow to render and web content was largely consumed on fat-core desktop computers. And while WC's purview was restricted to the browser it should have been feasible to develop a cross-platform templating language to support the specification. That templating language could have been natively supported by browsers while being constrained to be easily implementable in *any server side language* with string concatenation and without requiring any form of DOM emulation.  

With the first release of Next.js in ([2016](https://github.com/vercel/next.js/releases/tag/1.0.0)) the writing was on the wall that CSR wasn't enough even for component-oriented architectures. In 2018 [@popeindustries/lit-html-server](https://github.com/popeindustries/lit-html-server) appeared on [npm](https://www.npmjs.com/package/@popeindustries/lit-html-server) for WC SSR ([later](https://www.npmjs.com/package/@popeindustries/lit-html-server) to be included in the [Stack Overflow PWA Demo](https://so-pwa.firebaseapp.com/)), so the shortfall was becoming extremely apparent.

However one idea that didn't seem to catch on was settling on using [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) elements on the server rendered page to eliminate server and client template duplication, instead forcing the use of JS on the server to run JS Web Components for rendering as the preferred solution. This is likely due to the fact that delegating rendering markup to the server entirely removes the *convenient* “everything **and** the kitchen sink” [collocation](https://tidyfirst.substack.com/p/lumpers-and-splitters) of component-orientation. Framework components have created expections that vanilla Web Components simply cannot meet, while [not all "components" need to be DOM elements](https://youtu.be/BEWkLXU1Wlc?t=6359) ([Web Components Aren’t Components](https://keithjgrant.com/posts/2023/07/web-components-arent-components/)). 

There are plenty of competent Web Component analyses around, some of which are:
- [Why I don't use Web Components (2019)](https://dev.to/richharris/why-i-don-t-use-web-components-2cia)
- [Maybe Web Components are not the future? (2020)](https://dev.to/ryansolid/maybe-web-components-are-not-the-future-hfh)
- [The failed promise of Web Components (2020)](https://lea.verou.me/blog/2020/09/the-failed-promise-of-web-components/)
- [About Web Components (2021)](https://webreflection.medium.com/about-web-components-cc3e8b4035b0)

Aside from the lack of accomodation of WC SSR in the official spec, my other pet peeve is the way (Web) Component properties are often used (which was popularized by React).

[Attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) in *static* markup make sense. They express which specific *variation* of a *generic* element should be instantiated *during creation* of the live element. From a class-oriented perspective attributes are like constructor arguments (also [constructor injection](https://www.martinfowler.com/articles/injection.html#ConstructorInjectionWithPicocontainer)). But before Web Components, [`Element`s](https://developer.mozilla.org/en-US/docs/Web/API/Element) were programmatically created with [`document.createElement()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) which provided no way of passing constructor arguments. 

Here any configuration has to occur *after* creation via [properties](https://developer.mozilla.org/en-US/docs/Web/API/Element#instance_properties) (also [setter injection](https://www.martinfowler.com/articles/injection.html#SetterInjectionWithSpring); properties are just glorified setters/getters; even back in 2003 it was clear that [getters and setters are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html)).

With the existance of element properties it is even forgivable to use properties for some mild document interactivity/automation.

But then React popularized the notion of `props` (short for *properties*). They appear in the `class` [constructor](https://react.dev/reference/react/Component#constructor), so they're constructor arguments right? Not exactly. They're just the values React was passed to first render this particular *component* instance. `props` also exists on the *class* instance ([`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this#class_context)) but really isn't *owned* by the `class` instance but by React itself as it adjusts `props` whenever something passes new `props` by rendering a [`ReactElement`](https://react.dev/reference/react/createElement#createelement) to update the component instance. So in way `props` is a setter **that is managed by React**.

This enabled the now entrenched CSR [ownership composition pattern](https://shripadk.github.io/react/docs/multiple-components.html#ownership) (as opposed to [`children`](https://github.com/facebook/react/issues/3451#issuecomment-83489825)) of [advancing state](https://twitter.com/_chenglou/status/1701918301839135040) by modifying *ownee* (i.e. the nested component) `props`. With "functions as components" (function components, **not** *functional* components) the role of `props` has been clarified but the practice of component communication via `props` remains.

> What is usually glossed over is that the position of components in the component tree is related to the visual layout of the page which doesn't necessarily lead to the proximity of components that need to communicate with one another for the application to work. 

These inter-component communication requirements are often satiesfied via external state referenced via [context](https://react.dev/learn/passing-data-deeply-with-context).

The *ownership (or nested) composition pattern* tends to also surface in the design of many Web Components. One issue is that the creation values (attributes) are limited to being strings for vanilla WCs. WC-based libraries will often work around this by providing library specific [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) which create the WC instance behind the scenes to then later provide that instance with any non-string values via its instance *properties*. However the fundamental issue remains. The "actor" *rendering* the component isn't necessary the component (or components) that needs to *communicate* with it during its lifetime within the application.

That is why in this demo components **don't** *communicate* with one another. And while Web Components are `class`-based they are unabled to accept *any* constructor arguments. But thanks to the wonderful weirdness of JavaScript we call declare classes at runtime! That way Web Component classes are not created until the necessary dependencies have been passed to the supporting [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). Now this sequence of operations is followed: 
- the client side application is *resumed* with the `resume-data` found on the page
- with the application primed, its services can be passed to create the necessary Web Component classes (e.g. `makeDefinition()`)
- once the Web Component class is registered it can bind to the existing sites on the DOM but connects directly to the application services to
    - receive updates during its lifetime from the application
    - delegate user interactions for interpretation by the application

Note how component rendering has now been completely separated from component updates. So while one WC can render another nested WC it doesn't retain any "ownership" over it. A fresh component instance immediately registers itself with the application which takes ownership. 

Component-orientation often talks about **global state**—here we just call it **the application**. And there is nothing **evil global** about it. During the UI definition phase each component module/factory is injected with exactly the dependencies it needs; nothing less, nothing more. And it's the application that handles all the inter-component communication, so lack of component proximity within the page layout (leading to [prop drilling](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props)) isn't an issue. 
