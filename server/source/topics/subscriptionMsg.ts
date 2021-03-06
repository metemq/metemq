import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Subscription } from '../subscription';
import { SUBACK } from '../../ddmq/ackCodes';
import { parseJSON } from '../../ddmq/util';
import { getLogger } from '../../util/logger';

const logger = getLogger('$sub');

export default function subscriptionMsg(payload, params, source: Source) {
  let thingId: string = params.thingId;
  let name: string = params.name;

  logger.info('%s wants to subscribe %s', thingId, name);

  // Check unknown publish name
  if (!_.has(source.publications, name)) {
    // Send $suback message with NO_SUCH_PUBLICATION_NAME error code
    logger.info('Unknown publication %s, thingId=%s', name, thingId);
    source.send(`${thingId}/$suback/${name}`, SUBACK.NO_SUCH_PUBLICATION_NAME);
    return;
  }

  // Get publish handler of name
  let publication = source.publications[name];
  // Parse thing's comma-separated subscription parameters
  let pubParams = parseJSON(payload);
  // Get thing's session
  let session = source.getSession(thingId);
  /* TODO:
   * For now, just ignore if thing is already subscribing
   * publication that has same name.
   * But, maybe subscription parameters can be different.
   * In the future, we should handler this special case.
   */
  // Check thing is subscribing this publication already
  if (session.hasSubscription(name)) {
    logger.info('Duplicated subscription %j', { thingId, name });
    session.send(`$suback/${name}`, SUBACK.DUPLICATED_SUBSCRIPTION);
    return;
  }
  // New subscription!
  let subscription = new Subscription(name, session, publication, pubParams);
  // Register subscription at session
  session.registerSubscription(subscription);
  // Start subscription
  subscription.start();
  logger.info('New subscription started %j', { thingId, name, pubParams });
}
