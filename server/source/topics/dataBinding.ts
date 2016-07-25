import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Things } from '../../things';

export default function dataBinding(payload, params, source: Source) {
    let thingId: string = params.thingId;
    let field: string = params.field;

    //Block data since thing haven't session
    if (!_.has(source.sessions, thingId))
        return;

    if (typeof payload !== 'string' && typeof payload !== 'number')
        return;

    let data = { _id: thingId };
    data[field] = payload;

    if (Things.find({ _id: thingId }).count() === 0) {
        Things.insert(data);
    } else {
        Things.update({ _id: thingId }, data);
    }
}
