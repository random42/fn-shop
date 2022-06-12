import _ from 'lodash';
import path from 'path';
import type { PartialDeep } from 'type-fest';
import log from './log';
import { bot, setupBot } from './bot';
import db from './db';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.clear();
  const bot = await setupBot();
  await bot.launch();
  process.on('exit', () => {
    log.debug('exit');
  });
  log.info('run');
}

run().catch((e) => log.error(e));
