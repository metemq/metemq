import { Source } from 'meteor/metemq:metemq';
import { Mongo } from 'meteor/mongo';

const Things = new Mongo.Collection('Things');

describe('Source', function() {
  let source = new Source('mqtt://localhost');

  describe('#publish()', function() {
		let handler = function() {
			return Things.find()
		}

    it('should add publish handler whose key is its name, and value is handler', function() {
      source.publish('somePub', handler);

      assert.property(source.publishHandlers, 'somePub');
			assert.equal(handler, source.publishHandlers['somePub']);
    });

		it('should throws error, if there are duplicated publications', function() {
			assert.throws(function() {
				source.publish('somePub', function(){ });
			});
		});

		describe('publishHandlers', function() {
			it('should return cursor', function() {
				let cursor = source.publishHandlers['somePub']();
				assert.property(cursor, '_cursorDescription');
			})
		})
  });
});
