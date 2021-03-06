// NPM packages
import * as mqtt from 'mqtt';
import MqttEmitter = require('mqtt-emitter');
import { Broker } from 'metemq-broker';
// Meteor packages
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
// My packages
import { topicHandler, topicHandlers } from './topics/index';
import { pending, applied, rejected } from './methods';
import {
  DEFAULT_SOURCE_OPTIONS,
  SourceOptions
} from './sourceOptions';
import { Session } from './session';
import { Publication, PublishHandler } from './publication';
import { ThingsInbox } from 'meteor/metemq:metemq';
import { getLogger, setLevel } from '../util/logger';

const logger = getLogger('Source');

export class Source {

  private topic = new MqttEmitter();
  private publisher = null;
  private queue = new Array();
  private validators: { [op: string]: Function[] } = { 'connect': [] };

  /**
   * MQTT socket
   */
  mqtt: mqtt.Client;

  /**
   * MeteMQ Broker object. It's only defined if there is no brokerUrl
   */
  broker: Broker;

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

  constructor(options?: SourceOptions) {
    options = options || {};

    // Set log level
    setLevel(options.logLevel);

    // Set broker URL
    let brokerUrl = options.brokerUrl;
    if (!brokerUrl) {
      // Create embedded MeteMQ Broker if there is no brokerUrl
      let brokerOptions = options.brokerOptions || {};
      this.broker = new Broker(brokerOptions);
      // Set broker URL as localhost
      brokerUrl = 'mqtt://localhost:' + (brokerOptions.port || '1883');
    }

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

    this.publishSpecial('$inbox', function() {
      let thingId = this.thingId;

      return ThingsInbox.find({ thingId: thingId, state: 'initial' });
    }, ['_id', 'action', 'params']);

    this.registerSpecialMethods();
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
    if (name[0] === '$')
      throw new Error(`Publication name '${name}' cannot starts with $`);

    this.createPublication(name, handler, fields);
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

  allow(ops: { [op: string]: (...args) => boolean }) {
    const VALID_OPS = ['connect'];

    _.each(_.pairs(ops), (pair) => {
      const [op, validator] = pair;

      // type checks
      if (!_.contains(VALID_OPS, op))
        throw new Error(`Invalid key: ${op}`);
      if (!_.isFunction(validator))
        throw new Error(`allow value for ${op} should be a function not ${typeof validator}`);

      this.addValidator(op, validator);
    });
  }

  private addValidator(op: string, validator: (...args) => boolean) {
    this.validators[op].push(validator);
  }

  validate(op: string, ...args): boolean {
    const opValidators = this.validators[op];
    return _.every(opValidators, (validator) => validator(...args));
  }

  send(topic: string, message?: any) {
    if (typeof message === 'number')
      message = message.toString();
    if (typeof message === 'object' || typeof message === 'boolean')
      message = JSON.stringify(message);
    if (typeof message === 'undefined')
      message = '';

    this.queue.push({ topic, message });

    if (this.publisher === null) {
      this.publisher = setInterval(() => {
        let obj = this.queue.shift();

        logger.info('Send %j', obj);
        this.mqtt.publish(obj.topic, obj.message);

        if (this.queue.length === 0) {
          clearInterval(this.publisher);

          this.publisher = null;
        }
      }, 0);
    }
  }

  getSession(thingId: string): Session {
    // Throw error if there is no session for thing
    if (!this.hasSession(thingId))
      throw new Error(`There is no session for thing ${thingId}`);
    return this.sessions[thingId];
  }

  hasSession(thingId: string): boolean {
    return _.has(this.sessions, thingId);
  }

  createSession(thingId: string): Session {
    // Throw error if there is session already exists
    if (this.hasSession(thingId))
      throw new Error(`Session for thing ${thingId} already exists`);
    let newSession = new Session(thingId, this);
    // Register session
    this.sessions[thingId] = newSession;
    logger.info('A new session for %s created', thingId);
    return newSession;
  }

  removeSession(thingId: string) {
    this.sessions[thingId].close();
    delete this.sessions[thingId];
    logger.info('Session for %s removed', thingId);
  }

  close() {
    this.mqtt.end();
    if (this.broker)
      this.broker.close();
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

  //register metemq special methods
  private registerSpecialMethods() {
    this.methods({
      // '_metemq_act': act,  // action call from thing is not allowed for now, but maybe in the future...
      '_metemq_pending': pending,
      '_metemq_applied': applied,
      '_metemq_rejected': rejected
    });
  }

  //Creation of publication
  private createPublication(name, handler, fields) {
    this.publications[name] = new Publication(name, handler, fields);
  }

  //Special publish creation
  private publishSpecial(name, handler, fields) {
    this.createPublication(name, handler, fields);
  }
}
