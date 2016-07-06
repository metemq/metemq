import * as mqtt from 'mqtt';
import { Source } from '../source';

export default function subscriptionMsg(payload, params, source: Source) {
    try {
        JSON.parse(payload)
    }
    catch (err) {

    }
}
