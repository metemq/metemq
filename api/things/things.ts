import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import { Thing } from '../thing';

export const Things = new Mongo.Collection('things', {
    transform: function(doc) { return new Thing(doc); }
});
