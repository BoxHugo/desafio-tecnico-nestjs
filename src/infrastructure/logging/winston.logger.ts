import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { DateUtils } from '@shared/utils/utilsDate';

export const WinstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => {
          info.timestamp = DateUtils.getCurrentDate();
          return info;
        })(),
        winston.format.colorize(),
        winston.format.printf((info: any) => {
          const ts = String(info.timestamp);
          const lvl = String(info.level);
          const msg = String(info.message);
          const ctx = info.context ? String(info.context) : undefined;
          return ctx
            ? `${ts} [${lvl}] [${ctx}] ${msg}`
            : `${ts} [${lvl}] ${msg}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format((info) => {
          info.timestamp = DateUtils.getCurrentDate();
          return info;
        })(),
        winston.format.json(),
      ),
    }),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '2d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format((info) => {
          info.timestamp = DateUtils.getCurrentDate();
          return info;
        })(),
        winston.format.json(),
      ),
    }),
  ],
});

// import { WinstonModule } from 'nest-winston';
// import * as winston from 'winston';
// import DailyRotateFile = require('winston-daily-rotate-file');

// export const WinstonLogger = WinstonModule.createLogger({
//   transports: [
//     // Console formatado
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.colorize(),
//         winston.format.printf((info: any) => {
//           const ts = String(info.timestamp);
//           const lvl = String(info.level);
//           const msg = String(info.message);
//           const ctx = info.context ? String(info.context) : undefined;
//           return ctx
//             ? `${ts} [${lvl}] [${ctx}] ${msg}`
//             : `${ts} [${lvl}] ${msg}`;
//         }),
//       ),
//     }),
//     // Erros em arquivo
//     new winston.transports.File({
//       filename: 'logs/error.log',
//       level: 'error',
//       format: winston.format.json(),
//     }),
//     // Rotação diária de logs de aplicação
//     new DailyRotateFile({
//       dirname: 'logs',
//       filename: 'application-%DATE%.log',
//       datePattern: 'YYYY-MM-DD',
//       maxFiles: '2d',
//       zippedArchive: true,
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json(),
//       ),
//     }),
//   ],
// });
