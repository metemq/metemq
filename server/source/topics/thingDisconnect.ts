import { _ } from 'meteor/underscore';
import * as mqtt from 'mqtt';
import { Source } from '../source';

export default function thingDisconnect(payload, params, source: Source) {
  let thingId: string = params.thingId;

  if (!_.has(source.sessions, thingId))
    return; // Since there is no session for the thing

  // Get the thing's session
  let session = source.sessions[thingId];

  // Stop every subscriptions of the thing
  for (let sub of _.values(session.subscriptions))
    sub.stop();

  // Delete reference of session
  delete source.sessions[thingId];

  console.log(`${thingId} disconnected!`);
}
