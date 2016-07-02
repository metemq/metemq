declare module "mqtt-emitter" {
    import EventEmitter = NodeJS.EventEmitter;

    class MqttEmitter {
        on(topicPattern: string, listener: (payload, params) => void): void;
        emit(topic: string, payload: any);
    }

    export = MqttEmitter;
}
