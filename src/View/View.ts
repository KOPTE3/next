import {IEventEmitter} from '../EventManager/IEventEmitter';
import {IEventReceiver} from '../EventManager/IEventReceiver';
import {IEvent} from '../EventManager/IEvent';
import {IViewParsed} from './IViewParsed';
import {IVirtualDOMElement} from '../VirtualDOM/IVirtualDOMElement';
import {ApplicationContext} from '../ApplicationContext/ApplicationContext';
import {VirtualDOM} from '../VirtualDOM/VirtualDOM';
import {ViewConfig} from './ViewConfig';
import {JSWorksInternal} from '../Common/InternalDecorator';
import {ElementNotPoliteError} from '../Error/ElementNotPoliteError';
import {EventType} from '../EventManager/EventType';
import {SimpleVirtualDOMElement} from '../VirtualDOM/SimpleVirtualDOM/SimpleVirtualDOMElement';


declare const JSWorks: any;


@JSWorksInternal
export class View implements IEventEmitter, IEventReceiver {


    /**
     * Связанный с данной View компонент
     */
    public component: any;


    /**
     * Контекст приложения (Задаётся после загрузки соответствующего компонента/страницы).
     */
    public applicationContext: ApplicationContext;


    private _id: string;
    private template: IVirtualDOMElement;
    private _DOMRoot: IVirtualDOMElement;

    private appContext: ApplicationContext;
    private virtualDOM: VirtualDOM;
    private renderQueued: boolean = false;


    constructor(data: IViewParsed) {
        this._id = data.id;
        // this.template = data.template;

        this.appContext = JSWorks.applicationContext;
        this.virtualDOM = this.appContext.serviceHolder.getService('VirtualDOM');

        this._DOMRoot = data.template;
        // (<SimpleVirtualDOMElement> this._DOMRoot).propagateView(this);
        // Мы сделаем это позже

        /* this._DOMRoot = this.virtualDOM.createElement(ViewConfig.VIEW_TAG);
        this._DOMRoot.id = this._id;
        this._DOMRoot.view = this;
        this._DOMRoot.innerHTML = this.template.innerHTML; */

        // this._DOMRoot = this.template.cloneNode();
        // this._DOMRoot.view = this;
    }


    /**
     * ID текущей View
     * @returns {string}
     */
    public get id(): string {
        return this._id;
    }


    /**
     * Корневой элемент DOM данной View.
     * @returns {IVirtualDOMElement}
     * @constructor
     */
    public get DOMRoot(): IVirtualDOMElement {
        return this._DOMRoot;
    }


    /**
     * Склонировать текущий корневой элемент, присвоим ему переданный view
     * @param view
     */
    public cloneDOMRoot(view: View): void {
        this._DOMRoot.view = view;
        this._DOMRoot = this._DOMRoot.cloneNode();
    }


    /**
     * :P
     */
    public askToRender(): void {
        throw new ElementNotPoliteError(this);
    }


    /**
     * Сообрает View, что в виртуальном DOM произошли изменения, и было бы неплохо когда-нибудь их
     * отразить в реальном DOM.
     */
    public askToRenderPolitely(): void {
        if (!this.renderQueued) {
            this.renderQueued = true;

            window.setTimeout(() => {
                this.renderQueued = false;
                this.render();
            }, 1);
        }
    }


    /**
     * Обновляет виртуальный DOM этой View.
     */
    public render(): void {
        this.DOMRoot.render();
        this.emitEvent({ type: EventType.UPDATE, data: this });
    }


    /**
     * См. {EventManager}
     * @param event
     */
    public emitEvent(event: IEvent): void {} // tslint:disable-line


    /**
     * См. {EventManager}
     * @param event
     * @param emitter
     */
    public receiveEvent(event: IEvent, emitter: IEventEmitter) {} // tslint:disable-line

}
