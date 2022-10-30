import _ from 'lodash';
import assert from 'assert';
import log from './log';
import dotenv from 'dotenv';
dotenv.config({
  path: process.env.DOTENV,
});

assert(process.env.TG_TOKEN);

import db from './db';
import { setupBot } from './bot';
import { job } from './notify';

async function run() {
  await db.$connect();
  const bot = await setupBot();
  await bot.launch();
  job.start();
  log.info('start');
}

run().catch((e) => log.error(e));
