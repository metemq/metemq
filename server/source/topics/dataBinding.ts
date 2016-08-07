import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Things } from '../../things';
import { parseCSV } from '../../ddmq/util';

export default function dataBinding(payload: string, params, source: Source) {
    let thingId: string = params.thingId;
    let field: string = params.field;

    //Block data since thing haven't session
    if (!source.hasSession(thingId)) return;

    // Check wether payload is empty
    if (!payload.trim()) return;

    // Parse value, which can be number, string, or array of number|string
    const value = parseValue(payload);

    // Set update document
    let doc = { $set: {} };
    doc.$set[field] = value;

    // Update
    Things.update({ _id: thingId }, doc);
}

function parseValue(payload: string): number | string | Array<number | string> {
    let value = parseCSV(payload);

    if (value.length === 1) return value[0];
    else return value;
}
