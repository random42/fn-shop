import pino from 'pino';

const log = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  nestedKey: 'data',
  redact: {
    paths: ['pid', 'hostname'],
    remove: true,
  },
});

export default log;
