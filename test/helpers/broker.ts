import * as mosca from 'mosca';

export function createBroker(options, done?) {
    let broker = new mosca.Server(options);

    broker.on('ready', setup);

    function setup() {
        if (typeof done === 'function')
            done();
    }

    return broker;
}
