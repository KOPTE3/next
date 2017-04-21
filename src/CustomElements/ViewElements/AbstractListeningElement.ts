import {SimpleVirtualDOMElementExt} from '../../VirtualDOM/SimpleVirtualDOM/SimpleVirtualDOMElementExt';
import {View} from '../../View/View';
import {EventManager} from '../../EventManager/EventManager';
import {EventType} from '../../EventManager/EventType';
import {IEvent} from '../../EventManager/IEvent';


declare const JSWorks: any;


export abstract class AbstractListeningElement extends SimpleVirtualDOMElementExt {

    private updateDescriptor: number;

    /**
     * Подписаться на события от соответствующего компонента
     * @param component
     */
    public subscribeOnComponent(component: any): void {
        this.updateDescriptor = EventManager.subscribe(this, component, EventType.UPDATE, (event: IEvent) => {
            console.log('property change');
            this.propertyChange();
        });
    }


    /**
     * Отписаться от событий компонента
     * @param component
     */
    public unsubscribeFromComponent(component: any): void {
        EventManager.unsubscribe(this.updateDescriptor, component);
    }


    /**
     * Фабрика элементов
     * @returns {undefined}
     */
    public createElement(): AbstractListeningElement {
        // ToDo: Откуда берётся this? переделать
        console.log('subscribe', this);

        EventManager.subscribe(this, JSWorks.applicationContext, EventType.InstallViewsListeners, (ev) => {
            console.log('subscribing', this.view, (this.view || { component: undefined }).component);

            if (this.view && this.view.component && !this.hasAttribute('static')) {
                this.subscribeOnComponent(this.view.component);
                console.log('subscribed', this);
            }
        });

        return undefined;
    }


    /**
     * Пересчитать условие
     */
    public customUpdate(): void {
        if (this.hasAttribute('debug')) {
            console.log('custom abstract update', this);
        }

        super.customUpdate();

        if (this.view && this.view.component) {
            if (this.hasAttribute('static') && !this.ready) {
                return;
            }

            this.propertyChange();
        }
    }


    /**
     * Элементу была присвоена некоторая View
     * @param view
     */
    public propagateView(view: View): void {
        if (this.hasAttribute('static')) {
            super.propagateView(view);

            return;
        }

        if (this.view && this.view.component) {
            this.unsubscribeFromComponent(this.view.component);
        }

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

