declare module "meteor/metemq:metemq" {

    export class Source {
        private mqtt;
        private topic;

        publishHandlers: { [name: string]: Function };
        sessions: { [thingId: string]: Session };

        constructor(brokerUrl: string, options?: SourceOptions);

        publish(name: any, handler: any, options?: any): void;
        send(topic: string, message: number): any;
        send(topic: string, message: string): any;
        getSession(thingId: string): Session;

        private initialize();
        private registerHandlers();
        private addHandler(topicPattern, handler);
    }

    export interface SourceOptions {
        serverId?: string;
    }

    export class Session {
        private thingId;
        private source;

        subscriptions: { [name: string]: Subscription };

        constructor(thingId: string, source: Source);

        /**
         * @summary Send message to thing.
         * @param topic Topic without prefix of thingId.
         * @param payload Payload type of string or number.
         */
        send(topic: string, payload?: any): void;
        registerSubscription(subscription: Subscription): void;
        hasSubscription(name: string): boolean;
        getThingId(): string;
    }

    export class Subscription {
        private name;
        private session;
        private handler;
        private params;

        /**
         * Access inside publish handler.
         */
        thingId: string;

        constructor(name: string, session: Session, handler: Function, params: Array<string | number>);

        start(): void;
        send(topic: string, payload?: any): void;
        added(collectionName: string, id: string, fields: Object): void;
        changed(collectionName: string, id: string, fields: Object): void;
        removed(collectionName: string, id: string): void;
        error(e: any): void;
        getName(): string;

        private isCursor(c);
    }
}
