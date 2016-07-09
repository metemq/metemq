import { _ } from 'meteor/underscore';
import { Mongo } from 'meteor/mongo';
import { Session } from './session';

/**
 * Represents one thing session's one subscription.
 * It is responsible for tracking updates of subscribed documents,
 * and send proper messages when they updated.
 */
export class Subscription {
  
    constructor(
        private name: string,
        private session: Session,
        private handler: Function,
        private params: Array<string | number>
    ) { }

    start() {
        let cursors: Mongo.Cursor<any>[] = [];

        /**
         * Run handler and check return value of it.
         */
        try {
            // Run handler
            let ret = this.handler.apply(this.session, this.params);
            // Push all cursors into variable cursors
            if (_.isArray(ret))
                for (let val of ret)
                    cursors.push(val);
            else
                cursors.push(ret);

            // Check whether each element in cursors is cursor
            for (let cursor of cursors)
                if (!this.isCursor(cursor))
                    throw new Error('Publish handler should return array of Cursors');
        } catch (e) {
            this.error(e);
            return;
        }

        for (let cursor of cursors) {
            /* XXX:
             * _getCollectionName() is private function of Meteor's Cursor.
             * It can be removed in the future.
             */
            let collectionName = cursor._getCollectionName();

            cursor.observeChanges({
                added: (id, fields) => this.added(collectionName, id, fields),
                changed: (id, fields) => this.changed(collectionName, id, fields),
                removed: (id) => this.removed(collectionName, id),
            });
        }
    }

    send(topic: string, payload?: any) {
        this.session.send(`${this.name}/${topic}`, payload);
    }

    added(collectionName: string, id: string, fields: Object) {
        /** XXX:
         * We might need 3 message ID. messageId/#message/global_messageId
         * For example, a document was added, so we published three topics.
         * 'thing01/somePub/colName/doc02/field_1/added'
         * 'thing01/somePub/colName/doc02/field_2/added'
         * 'thing01/somePub/colName/doc02/field_3/added'
         * But, things don't know that they get all of messages when they get
         * first message. So, in my opinion, topics should be like
         * 'thing01/somePub/colName/doc02/field_1/added/1/3'
         * 'thing01/somePub/colName/doc02/field_2/added/2/3'
         * 'thing01/somePub/colName/doc02/field_3/added/3/3'
         * And, maybe pubsub messages can be received in arbitrary order,
         * so may need global_messageId like
         * 'thing01/somePub/colName/doc02/field_1/added/1/3/1234'
         */
        for (let key in fields) {
            let value = fields[key];
            this.send(`${collectionName}/${id}/added/${key}`, value);
        }
    }

    changed(collectionName: string, id: string, fields: Object) {
        for (let key in fields) {
            let value = fields[key];
            this.send(`${collectionName}/${id}/changed/${key}`, value);
        }
    }

    removed(collectionName: string, id: string) {
        this.send(`${collectionName}/${id}/removed`);
    }

    error(e) {
        /* TODO: Handle error */
    }

    private isCursor(c) { return c && _.isFunction(c.observeChanges); }

    getName(): string { return this.name; }
}
