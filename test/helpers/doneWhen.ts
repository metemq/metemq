import { Source } from 'meteor/metemq:metemq';

export function doneWhen(topic: string, source: Source, done: Function) {
  const listener = (incomingTopic, message) => {
    if (incomingTopic === topic) {
      source.mqtt.removeListener('message', listener);
      done();
    }
  }
  source.mqtt.on('message', listener);
}
