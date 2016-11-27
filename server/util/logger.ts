import winston = require('winston');

export function getLogger(label: string) {
  const logger = new (winston.Logger)({
    transports: [
      // colorize the output to the console
      new (winston.transports.Console)({
        colorize: true,
        prettyPrint: true,
        timestamp: true,
        label: label
      })
    ]
  });

  return logger;
};
