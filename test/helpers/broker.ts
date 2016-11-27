import * as mosca from 'mosca';
import * as portfinder from 'portfinder';

export function createBroker(callback: (broker) => void) {
  portfinder.getPort(function(err, port) {
    if (err) throw err;

    let broker = new mosca.Server({ port: port });

    broker.on('ready', setup);

    function setup() {
      callback(broker);
    }
  });
}
