declare module MeteMQ {

    export class Subscription {
        params: Array<string | number>
    }

    export class Session {
        subscriptions: { [name: string]: Subscription };
    }

    export class Source {
        publishHandlers: { [name: string]: Function };
        sessions: { [thingId: string]: Session };

        constructor(brokerUrl: string);

        publish(name: string, handler: Function, options?);
    }
}

declare module "meteor/metemq:metemq" {
    export = MeteMQ;
}
