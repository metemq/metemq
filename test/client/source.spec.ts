import { assert } from 'meteor/practicalmeteor:chai';
import { Source, ThingsInbox } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';

describe('class Source (client)', function() {
  const source = new Source();

  describe('#constructor(brokerUrl, options)', function() {
    // it('should connect to broker', function(done) {
    //     source.act('test.action', 'thing01')
    //
    //     setTimeout(function() {
    //         console.log(ThingsInbox.find().fetch());
    //         done();
    //     }, 1000)
    // });
  });
});
