// file: src/client/app.ts
export type FromTodoContent = (
	content: HTMLElement
) => [id: string, title: string] | [];

export type QsaoSpec = {
	connectedCallback?: (element: Element) => void;
	disconnectedCallback?: (element: Element) => void;
};
