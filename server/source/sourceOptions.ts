export const DEFAULT_SOURCE_OPTIONS: SourceOptions = {
  serverId: '$SERVER'
}

export interface SourceOptions {
  serverId?: string;
  brokerUrl?: string;
  brokerOptions?: BrokerOptions;
}

export interface BrokerOptions {
  port?: number;
  host?: string;
}
