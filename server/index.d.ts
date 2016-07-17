import * as mqtt from 'mqtt';

declare module "meteor/metemq:metemq" {

    export class Source {
        private topic;
        mqtt: mqtt.Client;
        /**
         * Object that stores publications
         * Key is publish name, and value is its publication object
         */
        publications: {
            [name: string]: Publication;
        };
        /**
         * Object that stores sessions of things
         * Key is thingId, and value is its session object
         */
        sessions: {
            [thingId: string]: Session;
        };
        /**
         * Object that stores method handlers
         * Key is name of a method, and value is its handler
         */
        methodHandlers: {
            [method: string]: Function;
        };
        constructor(brokerUrl: string, options?: SourceOptions);
        publish(name: string, handler: PublishHandler, fields: string[]): void;
        methods(methods: {
            [name: string]: Function;
        }): void;
        send(topic: string, message: number): any;
        send(topic: string, message: string): any;
        getSession(thingId: string): Session;
        private initialize();
        private registerHandlers();
        private addHandler(topicPattern, handler);
    }

    export type PublishHandler = (...args) => Mongo.Cursor<any>;

    export class Publication {
        name: string;
        handler: PublishHandler;
        fields: string[];
        constructor(name: string, handler: PublishHandler, fields: string[]);
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
