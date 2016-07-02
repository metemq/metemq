import { Mongo } from 'meteor/mongo';
import { topicHandler	} from './index';

const Logs = new Mongo.Collection('logs');

export default function messageLogger(payload, params, client) {
    let topic = params.topic;

    const doc = {
        topic: topic,
        payload: payload,
        date: new Date()
    }

    Logs.insert(doc);

		console.log(`#log = ${Logs.find().count()}`)
}
