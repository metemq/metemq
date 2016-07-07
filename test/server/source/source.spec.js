import { Source } from 'meteor/metemq:metemq';

describe('Source', function() {
  let source = new Source('mqtt://localhost');

  describe('#publish()', function() {
		
    it('should add publish handler whose key is its name, and value is handler', function() {
      let handler = function() {
        return 'hi!';
      }
      source.publish('somePub', handler);

      assert.property(source.publishHandlers, 'somePub');
			assert.equal(handler, source.publishHandlers['somePub']);
    });

		it('should throws error, if there are duplicated publications', function() {
			assert.throws(function() {
				source.publish('somePub', function(){ });
			});
		});
  });
});
