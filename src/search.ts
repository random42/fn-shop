import { getStore } from './api';
import bot from './bot';
import db, { match } from './db';
import cron from 'cron';
import log from './log';

export const searchAndNotify = async () => {
  const store = await getStore();
  const data = await match(store);
  log.info({ data }, 'match');
  return Promise.all(
    data.map(async (x) => {
      const { skins, user } = x;
      return bot.telegram.sendMessage(user.chatId, JSON.stringify(skins));
    }),
  );
};

export const createJob = () =>
  cron.job({
    cronTime: '*/10 * * * * *',
    onTick: () => {
      searchAndNotify().catch((err) => log.error(err));
    },
  });
