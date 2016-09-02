import { Mongo } from 'meteor/mongo';

export const Things = new Mongo.Collection('things');
export const ThingsInbox = new Mongo.Collection('things.inbox');
