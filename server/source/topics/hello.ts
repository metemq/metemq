export default function hello(payload, params, client) {
	let thingId = params.thingId;
	client.publish(`${thingId}/$inbox/Hi`, `Nice to meet you! [${i++}]`);
}

let i = 0;
