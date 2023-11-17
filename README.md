# astro-wc-ssr-demo
tl;dr—[`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) and the `HTMLTemplateElement` [`content`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement/content) property in combination with the `Node` [`cloneNode()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) method are probably the best bits to come out of the [Web Component API](https://developer.mozilla.org/en-US/docs/Web/API/Web_components#html_templates).

The following will discuss a recipe for implementing server rendered Web Components with any server language of choice (while commenting on some the ongoing trends in the Web Component narrative); i.e. without being locked into running JS on the server.
[Astro](https://astro.build/) is just used as a convenient server platform/templating engine but no "Web Component JS code" is run on the server (i.e. [isomorphic JS](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) isn't a requirement).

Lack of standardized SSR support is one of the greatest drawbacks of Web Components, especially as we are in the process of transitioning into [Generation 3](https://igor.dev/posts/experiences-web-frameworks-future-me/#return-to-server).
Granted some frameworks aim to support SSR ([Lit](https://lit.dev/docs/ssr/overview/) in particular but it still requires JS on the server) but at that point *one has already adopted a framework* which is acceptable if that is the shop framework.
Even when it comes to μ-frontends, the going recommendation is to stick to one, [single framework (and version)](https://youtu.be/A3n1n5QRmF0?t=1657).

The argument that any Web Component based framework will be comparatively [longer-lived](https://jakelazaroff.com/words/web-components-will-outlive-your-javascript-framework/) because "it's based on a platform standard" is also more than a little bit disingenuous ([AppCache](https://web.archive.org/web/20210603132501/https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache) ([2018](https://groups.google.com/a/chromium.org/g/blink-dev/c/FvM-qo7BfkI/m/0daqyD8kCQAJ)) would like a word); Polymer in particular went through a number of major revisions over the years (1.0 (2015), 2.0 (2017), 3.0 (2018), lit-html (2017), Lit 1.0 (2019), Lit 2.0 (2021), Lit 3.0 (2023)).

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

```Astro
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

While this example only has one single Web Component the guideline still applies. The component's responsibilities are limited to delegating UI interactions to the client side application and projecting some client side application events to the UI. Any behaviour is extremely shallow and strictly limited to manipulating the DOM in response to “UI bound events” and converting DOM events to “application bound events” ([Humble Dialog](https://github.com/peerreynders/solid-bookstore-a/blob/main/assets/TheHumbleDialogBox.pdf)).

- To be continued

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
- [ponyfill](https://ponyfoo.com/articles/polyfills-or-ponyfills)
- To be continued

## Some Thoughts on the Original Example

From a [recent article](https://adactio.com/journal/20618):

> HTML web components encourage a mindset of augmentation instead.

This is about [progressive enhancement](https://alistapart.com/article/understandingprogressiveenhancement/), i.e. rendering HTML on the server, letting the browser build the DOM without JS and then handing the completed DOM over to JavaScript *to augment*. A more appropriate name for *progressively enhanced elements* would have been [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)—a term already reserved to distinguish between *customized built-in elements* and *autonomous custom elements*.

Customized build-in elements are the closest to the notion of *progressively enhanced elements* but [WebKit has no intent on supporting them](https://github.com/WebKit/standards-positions/issues/97) (though this can be mitigated with [`builtin-elements`](https://github.com/WebReflection/builtin-elements).

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
- [Eshewing Shadow DOM (2019)](https://every-layout.dev/blog/eschewing-shadow-dom/)
- [Why I don't use Web Components (2019)](https://dev.to/richharris/why-i-don-t-use-web-components-2cia)
- [Maybe Web Components are not the future? (2020)](https://dev.to/ryansolid/maybe-web-components-are-not-the-future-hfh)
- [The failed promise of Web Components (2020)](https://lea.verou.me/blog/2020/09/the-failed-promise-of-web-components/)
- [About Web Components (2021)](https://webreflection.medium.com/about-web-components-cc3e8b4035b0)
- Even back in 2003 it was clear that [getters and setters are evil](https://www.infoworld.com/article/2073723/why-getter-and-setter-methods-are-evil.html).
- To be continued
