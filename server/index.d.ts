declare module MeteMQ {
    export const name: string;

    export class Source {
        constructor(brokerUrl: string);
    }
}

declare module "meteor/metemq:metemq" {
    export = MeteMQ;
}
