import { Source } from '../source';

export default function hello(payload, params, source: Source) {
	let thingId = params.thingId;
	source.send(`${thingId}/$inbox/Hi`, `Nice to meet you! [${i++}]`);
}

let i = 0;
