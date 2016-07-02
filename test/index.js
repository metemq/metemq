// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by metemq.js.
import { Source } from "meteor/metemq:metemq";

const source = new Source('mqtt://localhost');

// Write your tests here!
// Here is an example.
Tinytest.add('metemq - example', function (test) {
  test.equal("metemq", "metemq");
});
