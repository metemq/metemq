import { _ } from 'meteor/underscore';
import * as mqtt from 'mqtt';
import { Source } from '../source';
import { getLogger } from '../../util/logger';

const logger = getLogger('$disconnect');

export default function thingDisconnect(payload, params, source: Source) {
  let thingId: string = params.thingId;

  logger.info('Try to disconnect %s', thingId);

  if (!source.hasSession(thingId)) {
    logger.info('There is no session for %s', thingId);
    return; // Since there is no session for the thing
  }

  // Get the thing's session
  let session = source.getSession(thingId);

  // Stop every subscriptions of the thing
  for (let sub of _.values(session.subscriptions))
    sub.stop();

  // Delete reference of session
  source.removeSession(thingId);
  logger.info('%s disconnect', thingId);
}
