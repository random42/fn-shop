import axios from 'axios';
import _ from 'lodash';
import pino from 'pino';
import path from 'path';
import fs from 'fs-extra';
import type { PartialDeep } from 'type-fest';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import log from './log';
import tg from './bot';
import db from './db';

const [arg1] = process.argv.slice(2);
const defaultConfigPath = path.join(
  process.env.HOME,
  '.config/fn-shop/config.json',
);

type Config = {
  fn: {
    url: string;
    key: string;
  };
  tg: { token: string };
};

const defaultConfig = (): PartialDeep<Config> => ({
  fn: {
    url: 'https://api.fortnitetracker.com/v1',
  },
});

async function run() {
  console.clear();
  1;
  const configPath =
    arg1 && (await fs.pathExists(arg1)) ? arg1 : defaultConfigPath;
  let config: Config = await fs.readJSON('data/config.json');
  config = _.defaultsDeep(defaultConfig(), config);
  await db.user.create({
    data: {
      tgId: 1,
      chatId: 1,
    },
  });
  log.info(await db.user.findMany());

  // const bot = await tg(config.tg.token);
  process.on('exit', () => {
    log.debug('exit');
  });
  log.info('run');
}

run().catch((e) => log.error(e));
