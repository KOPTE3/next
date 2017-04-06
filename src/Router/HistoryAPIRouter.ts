import {Router} from './Router';
import {Route} from './Route';
import {JSWorksInternal} from '../Common/InternalDecorator';
import {EventManager} from '../EventManager/EventManager';
import {EventType} from '../EventManager/EventType';


declare const JSWorks: any;


@JSWorksInternal
export class HistoryAPIRouter extends Router {


    constructor(baseUrl: string) {
        super(baseUrl);

        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.name) {
                const route: Route = JSWorks.applicationContext.routeHolder.getRoute(String(event.state.name));

                route.fire(event.state.pathVariables);
                return;
            }
        });

        EventManager.subscribe(this, JSWorks.applicationContext, EventType.ApplicationLoaded, (event) => {
            const path =  window.location.href.split('/', 4)[3];
            const state = this.pathChange(path);

            state.route.fire(state.pathVariables);

            window.history.replaceState({name: state.route.name, pathVariables: state.pathVariables},
                state.route.name, this.baseUrl + state.route.getPath(state.pathVariables));
        });
    }


    /**
     * активировать роут и добавить новую запись в историю
     * @param route
     * @param pathVariables
     */
    public navigate(route: Route, pathVariables?: object): void {
        const path = route.getPath(pathVariables);
        route.fire(pathVariables);

        const state = {name: route.name, path: path, pathVariables: pathVariables};

        window.history.pushState(state, route.name, this.baseUrl + path);
    }


}
