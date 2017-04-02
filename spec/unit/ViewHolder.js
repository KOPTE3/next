'use strict';


describe('ViewHolder', () => {


    it('should exist and be initialized', () => {
        expect(JSWorks.Internal.ViewHolder).to.be.ok;
        expect(JSWorks.applicationContext.viewHolder).to.be.ok;
    });


    it('should load sample view', (done) => {
        const appContext = JSWorks.applicationContext;

        if (appContext.viewHolder.views['Sample']) {
            done();
            return;
        }

        JSWorks.EventManager.subscribe(null, appContext.viewHolder, JSWorks.EventType.LOAD, (event) => {
            expect(appContext.viewHolder.views['Sample']).to.be.ok;
            done();
        });
    });


    it('should render sample view', (done) => {
        const appContext = JSWorks.applicationContext;
        const view = appContext.viewHolder.views['Sample'];
        const virtualRoot = view.DOMRoot;
        const renderedRoot = virtualRoot.rendered;

        JSWorks.EventManager.subscribe({}, view, JSWorks.EventType.UPDATE, (event) => {
            const renderedTitle = renderedRoot.querySelector('h2');
            expect(renderedTitle.innerHTML).to.equal('It changed!');

            done();
        });

        const virtualTitle = virtualRoot.querySelector('h2');
        virtualTitle.innerHTML = 'It changed!';
    });


});