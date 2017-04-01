import {IAbstractVirtualDOMElement} from '../IAbstractVirtualDOMElement';
import {VirtualDOMElementArray} from '../VirtualDOMElementArray';
import {IEvent} from '../../EventManager/IEvent';
import {IEventEmitter} from '../../EventManager/IEventEmitter';
import {EventType} from '../../EventManager/EventType';
import {EventManager} from '../../EventManager/EventManager';
import {JSWorksInternal} from '../../Common/InternalDecorator';


@JSWorksInternal
export class SimpleVirtualDOMElement implements IAbstractVirtualDOMElement {

    /**
     * Переводит имена тэгов в нижний регистр в свойстве innerHTML и методе getOuterHTML
     * @type {boolean}
     */
    public lowerTagNames: boolean = true;


    /**
     * Флаг, указывающий на то, что данную ноду надо переписовать при рендеринге
     * @type {boolean}
     */
    public dirty: boolean = true;


    /**
     * Ссылка на отрисованный узел DOM, соответствующий данному узлу виртуального DOM
     */
    public rendered: Node;


    private _tagName: string;
    private _id: string;
    private _parentNode: SimpleVirtualDOMElement;
    private _children: SimpleVirtualDOMElement[] = [];
    private _text: string;
    private classes: Object = {};
    private attributes: Object = { style: {} };


    /**
     * Отрисовка изменений текущей ноды в поле rendered
     */
    public render(): void {
        if (!this.rendered) {
            this.dirty = false;

            if (!this.tagName) {
                this.rendered = document.createTextNode(this.text);
                return;
            }

            this.rendered = document.createElement('DIV');
            (<HTMLElement> this.rendered).innerHTML = this.getOuterHTML();
            this.rendered = this.rendered.childNodes[0];
            return;
        }

        if (this.dirty) {
            if (this.tagName !== (<HTMLElement> this.rendered).tagName) {
                this.rendered = undefined;
                this.render();
                return;
            }

            if (!this.tagName) {
                if (this.text !== this.rendered.textContent) {
                    this.rendered.textContent = this.text;
                }

                this.dirty = false;
                return;
            }

            if (this.id !== (<HTMLElement> this.rendered).id) {
                (<HTMLElement> this.rendered).id = this.id;
            }

            if (this.className !== (<HTMLElement> this.rendered).className) {
                (<HTMLElement> this.rendered).className = this.className;
            }

            Object.keys(this.attributes).forEach((attr: string) => {
                if (attr === 'id' || attr === 'class') {
                    return;
                }

                if (!((<HTMLElement> this.rendered).hasAttribute(attr))) {
                    const attribute = this.getAttribute(attr);

                    if (attribute) {
                        (<HTMLElement> this.rendered).setAttribute(attr, attribute);
                    }

                    return;
                }

                const value = this.getAttribute(attr);
                if ((<HTMLElement> this.rendered).getAttribute(attr) !== value) {
                    (<HTMLElement> this.rendered).setAttribute(attr, value);
                }
            });

            Array.from((<HTMLElement> this.rendered).attributes).forEach((attrPair) => {
                if (!this.hasAttribute(attrPair.name)) {
                    (<HTMLElement> this.rendered).removeAttribute(attrPair.name);
                }
            });

            this.dirty = false;

            this._children.forEach((child, index) => {
                child.render();

                if (index <= this.rendered.childNodes.length) {
                    this.rendered.appendChild(child.rendered);
                }

                if (this.rendered.childNodes[index] !== child.rendered) {
                    this.rendered.replaceChild(child.rendered, this.rendered.childNodes[index]);
                }
            });

            if (this.rendered.childNodes.length > this._children.length) {
                while (this._children.length !== this.rendered.childNodes.length) {
                    this.rendered.removeChild(this.rendered.lastChild);
                }
            }

            return;
        }

        this._children.forEach((child) => {
            const oldRendered = child.rendered;
            child.render();
            this.rendered.replaceChild(oldRendered, child.rendered);
        });
    }


    public get style(): Object {
        return this.attributes['style'];
    }


    public get tagName(): string {
        return this._tagName;
    }


    public set tagName(value: string) {
        this._tagName = value;
        this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
    }


    public get innerHTML(): string {
        if (this.isText()) {
            return this.text;
        }

        const html: string[] = [];

        this._children.forEach((child) => {
            html.push(child.getOuterHTML());
        });

        return html.join('');
    }


    public set innerHTML(value: string) {
        if (this.isText()) {
            this._text = value;
            return;
        }

        // ToDo: InnerHTML DOM Parse
    }


    public get id(): string {
        return this._id;
    }


    public set id(value: string) {
        this._id = value;
        this.setAttribute('id', value);
    }



    public get className(): string {
        return this.getAttribute('class');
    }


    public set className(value: string) {
        this.classes = {};

        value.replace('  ', ' ').split(' ').forEach((name) => {
            this.classes[name.toLowerCase()] = true;
        });

        this.setAttribute('class', value);
    }


    public get parentNode(): SimpleVirtualDOMElement {
        return this._parentNode;
    }


    public set parentNode(node: SimpleVirtualDOMElement) {
        if (this._parentNode) {
            this._parentNode.removeChild(this);
        }

        this._parentNode = node;

        if (node) {
            node.appendChild(this);
        }

        this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
    }


    public get children(): VirtualDOMElementArray {
        return new VirtualDOMElementArray(this._children);
    }


    public get text(): string {
        return this._text;
    }


    public set text(value: string) {
        this._text = value;
        this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
    }


    /**
     * Получить атрибут виртуального элемента
     * @param name
     * @returns {any}
     */
    public getAttribute(name: string): any {
        if (name.toLowerCase() === 'style') {
            if (Object.keys(this.attributes['style']).length === 0) {
                return;
            }

            const value = [];
            Object.keys(this.attributes['style']).forEach((cssRule) => {
                value.push(`${cssRule}: ${String(this.attributes['style'][cssRule])};`);
            });

            return value.join(' ');
        }

        return this.attributes[name];
    }


    /**
     * Задать атрибут виртуального элемента
     * @param name
     * @param value
     */
    public setAttribute(name: string, value?: any): void {
        if (name.toLowerCase() === 'style') {
            const expressions: string[] = (<string> value).split(';');

            expressions.forEach((expression: string) => {
                const css: string[] = expression.split(':');

                css[0] = css[0].trim();
                css[1] = (css[1] || 'inherit').trim();

                if (css[0].length === 0) {
                    return;
                }

                this.attributes['style'][css[0]] = css[1];
            });

            this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
            return;
        }

        this.attributes[name] = value;
        this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
    }


    /**
     * Проверить существование атрибута
     * @param name
     * @returns {boolean}
     */
    public hasAttribute(name: string): boolean {
        return this.attributes[name] !== undefined;
    }


    /**
     * Удалить данный атрибут. Если такого не существует, то не произойдёт ничего.
     * @param name
     */
    public removeAttribute(name: string): void {
        delete this.attributes[name];
        this.emitMutilationEvent({ type: EventType.DOMPropertyChange, data: this });
    }


    /**
     * Запустить событие
     * @param event
     */
    public emitEvent(event: IEvent): void {} // tslint:disable-line


    /**
     * Обработать событие
     * @param event
     * @param emitter
     */
    public receiveEvent(event: IEvent, emitter: IEventEmitter): void {
        this.dirty = true;
    }


    /**
     * Применить/отменить класс к элементу
     * @param name
     * @param on
     */
    public toggleClass(name: string, on: boolean): void {
        name = name.toLowerCase();

        if (on) {
            if (!this.classes[name]) {
                this.classes[name] = true;
                this.setAttribute('class', Object.keys(this.classes).join(' '));
                return;
            }

            return;
        }

        if (this.classes[name]) {
            this.classes[name] = undefined;
            this.setAttribute('class', Object.keys(this.classes).join(' '));
        }
    }


    /**
     * Добавить потомка к узлу
     * @param child
     */
    public appendChild(child: SimpleVirtualDOMElement): void {
        this._children.push(child);
        this.emitMutilationEvent({ type: EventType.DOMChildAppend, data: { parent: this, child: child } });
        EventManager.subscribe(this, child);
    }


    /**
     * Удалить потомка
     * @param child
     */
    public removeChild(child: SimpleVirtualDOMElement): void {
        this._children.splice(this._children.lastIndexOf(child, 0), 1);
        this.emitMutilationEvent({ type: EventType.DOMChildRemove, data: { parent: this, child: child } });
    }


    /**
     * Удалить узел
     */
    public remove(): void {
        this.emitMutilationEvent({ type: EventType.DOMRemove, data: this });
    }


    /**
     * Возвращает полный HTML-текст данного элемента
     * @returns {string}
     */
    public getOuterHTML(): string {
        const attrSerialized: string[] = [];

        Object.keys(this.attributes).forEach((name) => {
            const attr = this.getAttribute(name);

            if (attr) {
                attrSerialized.push(`${name}="${attr}"`);
                return;
            }

            if (name === 'style' || name === 'id' || name === 'class') {
                return;
            }

            attrSerialized.push(`${name}="${attr}"`);
        });

        const content = this.innerHTML;

        if (this.tagName) {
            let spacer = '';

            if (attrSerialized.length > 0) {
                spacer = ' ';
            }

            let tagName = this.tagName;

            if (this.lowerTagNames) {
                tagName = tagName.toLowerCase();
            }

            return `<${tagName}${spacer}${attrSerialized.join(' ')}>${content}</${tagName}>`;
        }

        return content;
    }


    /**
     * Возвращает true, если данный узел виртуального DOM является простым текстом.
     * @returns {boolean}
     */
    public isText(): boolean {
        return this.tagName === undefined;
    }


    private emitMutilationEvent(data: IEvent) {
        this.dirty = true;
        this.emitEvent(data);
    }

}
