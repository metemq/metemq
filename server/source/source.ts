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
import { Session } from './session';
import { Publication, PublishHandler } from './publication';

export class Source {

    private topic = new MqttEmitter();
    private publisher = null;
    private queue = new Array();

    mqtt: mqtt.Client;

    /**
     * Object that stores publications
     * Key is publish name, and value is its publication object
     */
    publications: { [name: string]: Publication } = {};
    /**
     * Object that stores sessions of things
     * Key is thingId, and value is its session object
     */
    sessions: { [thingId: string]: Session } = {};
    /**
     * Object that stores method handlers
     * Key is name of a method, and value is its handler
     */
    methodHandlers: { [method: string]: Function } = {};

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

    publish(name: string, handler: PublishHandler, fields: string[]) {
        if (_.has(this.publications, name))
            throw new Error('Duplicated publishes');
        if (typeof handler !== 'function')
            throw new Error(`Handler of publication ${name} is not a function`);
        if (!_.isArray(fields))
            throw new Error(`Fields of publication ${name} is not an array`);
        if (fields.length === 0)
            throw new Error(`Fields of publication ${name} should contain one field at least`);

        this.publications[name] = new Publication(name, handler, fields);
    }

    methods(methods: { [name: string]: Function }) {
        for (let method in methods) {
            let handler = methods[method];

            if (typeof handler !== 'function')
                throw new Error(`Type of method '${method}' must be function!`);
            if (_.has(this.methodHandlers, method))
                throw new Error(`A method ${method} is already defined`);

            this.methodHandlers[method] = handler;
        }
    }

    send(topic: string, message: number)
    send(topic: string, message: string)
    send(topic: string, message?: any) {
        if (typeof message === 'number')
            message = message.toString();
        if (typeof message === 'object')
            message = JSON.stringify(message);
        if (typeof message === 'undefined')
            message = '';

        this.queue.push({topic, message});

        if (this.publisher === null) {
            this.publisher = setInterval( () => {
                let obj = this.queue.shift();

                this.mqtt.publish(obj.topic, obj.message);

                if (this.queue.length === 0) {
                    clearInterval(this.publisher);

                    this.publisher = null;
                }
            }, 0);
        }
    }

    getSession(thingId: string): Session {
        // Return existing session if it exists
        if (_.has(this.sessions, thingId))
            return this.sessions[thingId];
        // There is no session exists. Create new session
        let newSession = new Session(thingId, this);
        // Register session
        this.sessions[thingId] = newSession;

        return newSession;
    }

    private initialize() {
        this.mqtt.on('connect', Meteor.bindEnvironment(() => {
            console.log('Source connected to MeteMQ Broker!')
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
