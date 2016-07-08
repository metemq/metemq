// NPM packages
import * as mqtt from 'mqtt';
import MqttEmitter = require('mqtt-emitter');
// Meteor packages
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
// My packages
import { topicHandler, topicHandlers } from './topics/index';
import {
    DEFAULT_SOURCE_OPTIONS,
    SourceOptions
} from './sourceOptions';

export class Source {
    private mqtt: mqtt.Client;
    private topic = new MqttEmitter();
    // Object that stores publish handlers.
    // Key is publish name, and value is its handler
    publishHandlers: { [name: string]: Function } = {};

    constructor(brokerUrl: string, options?: SourceOptions) {
        // Overide default options with user defined options
        const extendedOptions = _.extend(DEFAULT_SOURCE_OPTIONS, options);

        // Setup MQTT client options
        const mqttOptions: mqtt.ClientOptions = {
            clientId: extendedOptions.serverId
        }

        // Connect to MQTT broker
        this.mqtt = mqtt.connect(brokerUrl, mqttOptions);

        this.initialize();

        this.registerHandlers();
    }

    publish(name, handler, options?) {
        if (_.has(this.publishHandlers, name))
            throw new Error('Duplicated publishes');

        this.publishHandlers[name] = handler;
    }

    send(topic: string, message: string) {
        this.mqtt.publish(topic, message);
    }

    private initialize() {
        this.mqtt.on('connect', Meteor.bindEnvironment(() => {
            console.log('MQTT connected!')
            this.mqtt.subscribe('#');
        }));

        this.mqtt.on('message', Meteor.bindEnvironment((topic: string, message: Buffer) => {
            let payload = message.toString();
            this.topic.emit(topic, payload);
        }));
    }

    // Register every topic handlers in topics/index.ts
    private registerHandlers() {
        for (let topic in topicHandlers)
            this.addHandler(topic, topicHandlers[topic]);
    }

    // Add topic handler
    private addHandler(topicPattern, handler: topicHandler) {
        this.topic.on(topicPattern,
            (payload, params) => handler(payload, params, this))
    }
}
