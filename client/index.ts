import { Meteor } from 'meteor/meteor';

export function act() {
	Meteor.call('/metemq/act')
}
