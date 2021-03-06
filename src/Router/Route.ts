import {JSWorksInternal} from '../Common/InternalDecorator';
import {IEventEmitter} from '../EventManager/IEventEmitter';
import {IEvent} from '../EventManager/IEvent';
import {EventType} from '../EventManager/EventType';
import {ComponentHolder} from '../Component/ComponentHolder';
import {ViewConfig} from '../View/ViewConfig';
import {JSWorksLib} from '../jsworks';


declare const JSWorks: JSWorksLib;


@JSWorksInternal
export class Route implements IEventEmitter {

    /**
     * вложенные роуты
     */
    public children: object = {};

    /**
     * имя переменной пути, начинается с ':', может быть нулл
     */
    public pathVariableName: string;

    /**
     * имя роута
     */
    public name: string;

    /**
     *  часть адреса url, данного роута, если этот роут матчится по path variable, то match = '*'
     */
    public match: string;

    /**
     * url
     */
    public path: string;


    /**
     * Имя страницы, к которой ведёт данный маршрут
     */
    public pageName: string;


    constructor(match: string, path: string, pathVariableName?: string, name?: string, pageName?: string) {
        this.match = match;
        this.path = path;
        this.pathVariableName = pathVariableName;
        this.name = name;
        this.pageName = pageName;
    }


    /**
     * Метод вызывается, когда на маршрут переходят
     * @param pathVariables
     */
    public fire(pathVariables: object): void {
        // ToDo: fire component method with pathVariables

        this.emitEvent({ type: EventType.ROUTE_FIRED, data: this });
        const componentHolder: ComponentHolder = JSWorks.applicationContext.componentHolder;

        if (this.pageName && componentHolder.getPage(this.pageName)) {
            const page = componentHolder.getPage(this.pageName);
            const root: Element = document.querySelector(ViewConfig.ROOT_TAG);

            if (root.firstChild !== page.view.DOMRoot.rendered) {
                root.innerHTML = '';
                root.appendChild(page.view.DOMRoot.rendered);
            }

            JSWorks.applicationContext.currentPage = page;

            if (page.controller.onNavigate) {
                page.controller.onNavigate(pathVariables);
            }
        }
    }


    /**
     * вернуть реальный url
     * @param args объект с переменными пути
     * @returns {string}
     */
    public getPath(args: object): string {
        let path = this.path;

        if (args) {
            Object.keys(args).forEach((pathVar) => {
                let regexp = new RegExp(pathVar);

                if (pathVar.charAt(0) !== ':') {
                    regexp = new RegExp(`:${pathVar}`);
                }

                path = path.replace(regexp, args[pathVar]);
            });
        }

        return path;
    }

    public emitEvent(event: IEvent): void {}  // tslint:disable-line
}
