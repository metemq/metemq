import winston = require('winston');

const loggers: winston.LoggerInstance[] = [];
let globalLevel = winston.level;

export function getLogger(label: string) {
  const logger = new (winston.Logger)({
    transports: [
      // colorize the output to the console
      new (winston.transports.Console)({
        colorize: true,
        prettyPrint: true,
        timestamp: true,
        level: globalLevel,
        label: label
      })
    ]
  });

  loggers.push(logger);

  return logger;
};

export function setLevel(level) {
  globalLevel = level;
  for (const logger of loggers) {
    logger.level = globalLevel;
  }
};
