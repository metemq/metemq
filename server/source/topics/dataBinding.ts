import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Things } from 'meteor/metemq:metemq';
import { parseJSON } from '../../ddmq/util';
import { getLogger } from '../../util/logger';
import { BINDACK } from '../../ddmq/ackCodes';

const logger = getLogger('$bind');

export default function dataBinding(payload: string, params, source: Source) {
  let thingId: string = params.thingId;
  let field: string = params.field;

  //Block data since thing haven't session
  if (!source.hasSession(thingId)) {
    logger.warn('There is no session for %s! Ignore $bind', thingId);
    return;
  }

  // Check wether payload is empty
  if (!payload.trim()) {
    logger.warn('Payload is empty. Ignore $bind. %j', { thingId, field });
    return;
  }

  // Parse value, which can be number, string, or array of number|string
  const value = parseValue(payload);

  // Set update document
  let doc = { $set: { updatedAt: new Date() } };
  doc.$set[field] = value;

  // Update
  Things.update({ _id: thingId }, doc);
  logger.info('%s updated %j', thingId, doc.$set);

  // Send $bindack message
  source.send(`${thingId}/$bindack/${field}`, BINDACK.OK);
}

function parseValue(payload: string): number | string | Array<number | string> {
  let value = parseJSON(payload);

  if (value.length === 1) return value[0];
  else return value;
}
