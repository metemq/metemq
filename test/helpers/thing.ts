import * as mqtt from 'mqtt';

export function createThing(port: number, done?: Function): MockThing {
    if (typeof done !== 'function')
        done = () => { }

    let thing = new MockThing(port);

    thing.client.once('connect', () => done());

    return thing;
}

export class MockThing {
    thingId: string;
    client: mqtt.Client;

    constructor(port) {
        this.thingId = generateThingId();
        this.client = mqtt.connect(`mqtt://localhost:${port}`,
            { clientId: this.thingId });
    }

    subscribe(name: string, cb?: Function) {
        if (typeof cb !== 'function')
            cb = () => { };

        this.client.subscribe(`${this.thingId}/${name}/#`, () => {
            this.client.publish(`${this.thingId}/$sub/${name}`, '', {}, () => cb());
        });
    }
}

function generateThingId(): string {
    return 't' + i++;
}

let i = 0;
