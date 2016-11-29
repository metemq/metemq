export const DEFAULT_SOURCE_OPTIONS: SourceOptions = {
  serverId: '$SERVER',
  logLevel: 'info',
}

export interface SourceOptions {
  serverId?: string;
  brokerUrl?: string;
  brokerOptions?: BrokerOptions;
  logLevel?: string;
}

export interface BrokerOptions {
  port?: number;
  host?: string;
}
