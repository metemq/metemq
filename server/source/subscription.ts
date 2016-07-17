import { _ } from 'meteor/underscore';
import { Mongo } from 'meteor/mongo';
import { Session } from './session';
import { Publication } from './publication';
import { mkString } from '../ddmq/util';

/**
 * Represents one thing session's one subscription.
 * It is responsible for tracking updates of subscribed documents,
 * and send proper messages when they updated.
 */
export class Subscription {

    /**
     * Access inside publish handler.
     */
    thingId: string;
    queryHandles: Meteor.LiveQueryHandle[] = [];

    constructor(
        private name: string,
        private session: Session,
        private publication: Publication,
        private params: Array<string | number>
    ) {
        this.thingId = session.getThingId();
    }

    start() {
        let cursor: Mongo.Cursor<any>;
        /**
         * Run handler and check return value of it.
         */
        try {
            /**
             * Run handler.
             * Inside of handler function, 'this' is subscription object,
             * and arguments are parameters that the thing sent.
             * Since 'this' is subscription, users can use 'this.thingId' to
             * enrich their logic.
             */
            cursor = this.publication.handler.apply(this, this.params);

            if (!this.isCursor(cursor))
                throw new Error(`Handler of publication '${this.publication.name}' should return array of Cursors`);
        } catch (e) {
            this.error(e);
            return;
        }

        // Track documents of cursor
        let queryHandle = cursor.observeChanges({
            added: (id, fields) => this.added(_.extend(fields, { _id: id })),
            changed: (id, fields) => this.changed(fields),  // _id is not a changed field
            removed: (id) => this.removed(id),
        });

        this.queryHandles.push(queryHandle);
    }


    stop() {
        // The query will run forever unless you call stop()
        for (let queryHandle of this.queryHandles)
            queryHandle.stop();
    }

    send(topic: string, payload?: any) {
        this.session.send(`${this.name}/${topic}`, payload);
    }

    added(fields: Object) {
        // Convert fields to CSV string
        let csvString = this.fields2csv(fields);
        // If length of CSV string is smaller than length of user-defined fields,
        // then csvString only contrains comma
        // That means we don't have to send message to the thing
        if (csvString.length < this.publication.fields.length) return;
        // Send $added message to the thing
        this.send('$added', csvString);
    }

    changed(fields: Object) {
        // Convert fields to CSV string
        let csvString = this.fields2csv(fields);
        // If length of CSV string is smaller than length of user-defined fields,
        // then csvString only contrains comma
        // That means we don't have to send message to the thing
        if (csvString.length < this.publication.fields.length) return;
        // Send $changed message to the thing
        this.send('$changed', csvString);
    }

    removed(id: string) {
        if (_.contains(this.publication.fields, '_id'))
            this.send('$removed', id);
    }

    error(e) {
        /* TODO: Handle error */
        console.error(e);
    }

    getName(): string { return this.name; }

    private fields2csv(fields: Object): string {
        let arr = [];
        // Collect user-defined fields in order
        for (let field of this.publication.fields)
            arr.push(fields[field]);
        // Field value type check
        if (!this.isSimpleArray(arr))
            throw new Error(`Cursor which is returned by publish ${this.publication.name} should only contain string or number fields`);
        // Convert array to CSV string
        return mkString(arr);
    }

    /**
     * If input array is an array of string & number, then true, else false
     */
    private isSimpleArray(arr): boolean {
        if (!_.isArray(arr)) return false;
        for (let val of arr)
            if (val === undefined) continue;
            else if (typeof val !== 'string' && typeof val !== 'number')
                return false;
        return true;
    }

    private isCursor(c) { return c && _.isFunction(c.observeChanges); }
}
