import _ from 'lodash';
import path from 'path';
import type { PartialDeep } from 'type-fest';
import log from './log';
import { bot, setupBot } from './bot';
import db, { match } from './db';
import dotenv from 'dotenv';
import { getStore } from './api';

dotenv.config();

async function run() {
  console.clear();
  const bot = await setupBot();
  await bot.launch();
  const store = await getStore();
  log.info({ store: store.slice(0, 2) });
  const data = await match(store);
  log.info(data, 'match');
  process.on('exit', () => {
    log.debug('exit');
  });
  log.info('run');
}

run().catch((e) => log.error(e));
