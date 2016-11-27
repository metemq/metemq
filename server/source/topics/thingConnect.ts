import { CONNACK } from '../../ddmq/ackCodes';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { Things } from 'meteor/metemq:metemq';
import { getLogger } from '../../util/logger';

const logger = getLogger('$connect');

export default function thingConnect(payload, params, source: Source) {
  const thingId: string = params.thingId;
  const msgId: string = params.msgId;

  const parsed = JSON.parse(payload);
  const username: string | undefined = parsed.username;
  const password: string | undefined = parsed.password;

  logger.info('Incoming connect request from %s', thingId);

  // If there is already existing session
  if (source.hasSession(thingId)) {
    logger.info('Session already exists for %s', thingId);
    source.removeSession(thingId);
  }
  // Check password if there is username & password
  if (username && password) {
    // Code is zero, if there is no error
    const code = checkPassword(username, password);
    // If there was error, send connack message with error code and exit
    if (code) {
      logger.info('Incorrect password %j', { thingId, username });
      return sendConnack(code);
    }
  }

  /* TODO: isAllowed? If return value of user-defined allow function is false,
   * Stop here and send $connack false.
   */

  // If there is no document of the thing, it's new thing!
  if (Things.find({ _id: thingId }).count() === 0) {
    const userId = username ? findUserId(username) : null;

    const newThing = {
      _id: thingId,
      _owner: userId
    };

    logger.info('Insert new Thing %j', newThing);
    Things.insert(newThing);
  }

  // Create session for the thing
  source.createSession(thingId);

  // Send $connack message with true
  sendConnack(CONNACK.OK);

  function sendConnack(errorCode: number) {
    source.send(`${thingId}/$connack/${msgId}`, errorCode);
  }
}

// Check password for username is right
function checkPassword(username, password): number {
  // Get user document
  let user = Meteor.users.findOne({ username: username });
  // Return NO_SUCH_USER, if user does not exist
  if (!user) return CONNACK.NO_SUCH_USER;
  // Check password
  let result = Accounts._checkPassword(user, password);
  // Return WRONG_PASSWORD if there is error, else OK
  if (result.error) return CONNACK.WRONG_PASSWORD;
  // Return zero if there is no error
  else return CONNACK.OK;
}

function findUserId(username): string {
  return Meteor.users.findOne({ username: username })._id;
}
