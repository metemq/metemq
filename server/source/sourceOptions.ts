export const DEFAULT_SOURCE_OPTIONS: SourceOptions = {
    serverId: '$SERVER',
    username: 'localhost',
    password: 'localhost'
}

export interface SourceOptions {
    serverId?: string;
    brokerUrl?: string;
    username?: string;
    password?: string;
    brokerOptions?: BrokerOptions;
}

export interface BrokerOptions {
    port?: number;
    host?: string;
}
