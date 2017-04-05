import {SimpleVirtualDOMElementExt} from '../../VirtualDOM/SimpleVirtualDOM/SimpleVirtualDOMElementExt';
import {View} from '../../View/View';
import {EventManager} from '../../EventManager/EventManager';
import {EventType} from '../../EventManager/EventType';
import {IEvent} from '../../EventManager/IEvent';


declare const JSWorks: any;


export abstract class AbstractListeningElement extends SimpleVirtualDOMElementExt {


    /**
     * Подписаться на события от соответствующего компонента
     * @param component
     */
    public subscribeOnComponent(component: any): void {
        EventManager.subscribe(this, component, EventType.UPDATE, (event: IEvent) => {
            this.propertyChange();
        });
    }


    /**
     * Фабрика элементов
     * @returns {undefined}
     */
    public createElement(): AbstractListeningElement {
        EventManager.subscribe(this, JSWorks.applicationContext, EventType.InstallViewsListeners, (ev) => {
            if (this.view && this.view.component) {
                this.subscribeOnComponent(this.view.component);
            }
        });

        return undefined;
    }


    /**
     * Элементу была присвоена некоторая View
     * @param view
     */
    public propagateView(view: View): void {
        // ToDo: unsubscribe

        super.propagateView(view);

        if (this.view && this.view.component) {
            this.subscribeOnComponent(this.view.component);
        }
    }


    /**
     * Будет вызван при изменении компонента, на который данный тэг был подписан
     */
    public abstract propertyChange(): void;

}

