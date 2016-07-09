declare module MeteMQ {
    export const name: string;

    export class Source {
        publishHandlers: { [name: string]: Function };

        constructor(brokerUrl: string);

        publish(name: string, handler: Function, options?);
    }
}

declare module "meteor/metemq:metemq" {
    export = MeteMQ;
}
