import _ from 'lodash';
import path from 'path';
import type { PartialDeep } from 'type-fest';
import log from './log';
import bot, { setupBot } from './bot';
import db, { match } from './db';
import dotenv from 'dotenv';
import { getStore } from './api';
import { createJob } from './search';

dotenv.config();

async function run() {
  console.clear();
  const bot = await setupBot();
  await bot.launch();
  createJob();
  log.info('start');
}

run().catch((e) => log.error(e));
