import { _ } from 'meteor/underscore';
import { Source } from './source';
import { Subscription } from './subscription';

/**
 * Represents session of a thing.
 * Source manages sessions.
 */
export class Session {
    // Subscriptions that thing is subscribing
    // Key is name of publication, and value is subscription object
    subscriptions: { [name: string]: Subscription } = {};

    constructor(
        private thingId: string,
        private source: Source,
        private userId?: string
    ) { }

    /**
     * @summary Send message to thing.
     * @param topic Topic without prefix of thingId.
     * @param payload Payload type of string or number.
     */
    send(topic: string, payload?: any) {
        this.source.send(`${this.thingId}/${topic}`, payload);
    }

    registerSubscription(subscription: Subscription) {
        let name = subscription.getName();
        // Return if this session already has subscription
        if (this.hasSubscription(name)) return;
        // Register subscription
        this.subscriptions[name] = subscription;
    }

    hasSubscription(name: string): boolean {
        return _.has(this.subscriptions, name);
    }

    getThingId(): string { return this.thingId; }

    getUserId(): string { return this.userId; }

    setUserId(userId: string) { this.userId = userId; }
}
