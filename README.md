# MeteMQ
MeteMQ is an IoT app platform based on [Meteor](https://www.meteor.com/), and [MQTT](http://mqtt.org/). It's the easiest way to build an IoT application with JavaScript.

* [Installation](#install)
* [Example](#example)
* [Test](#test)

<a name="install"></a>
## Installation
If you don't have [Meteor](https://www.meteor.com/) on your PC, install it first.

On Windows, simply go to https://www.meteor.com/install and use the Windows installer.

On Linux/macOS, use this line:

```bash
curl https://install.meteor.com/ | sh
```
Add MeteMQ package to your Meteor project:

```bash
meteor add metemq:metemq
```

<a name="example"></a>
## Example

```javascript
import { Source, Things } from 'meteor/metemq:metemq';

const source = new Source();

source.publish('demo', function() {
	return DemoCollection.find();
}, ['name', 'age']);

source.methods({
	hello() {
		console.log(`Thing ${this.thingId} says "hello"`);
		return 'world!';
	}
});
```

<a name="test"></a>
## Test

```bash
meteor test-packages --driver-package practicalmeteor:mocha ./
```

You'll then be able to read the report locally in your browser at
`http://localhost:3000/`.
