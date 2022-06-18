import { getStore } from './api';
import bot from './bot';
import { match, StoreItem } from './db';
import cron from 'cron';
import log from './log';

const { NOTIFY_CRON } = process.env;

const formatItemString = (x: StoreItem) =>
  `${x.name}\n$Rarity: ${x.rarity}\nvBucks: ${x.vBucks}\n${x.imageUrl}`;

export const searchAndNotify = async () => {
  const store = await getStore();
  log.info({ store: store.slice(0, 2) });
  const data = await match(store);
  log.info({ data }, 'match');
  return Promise.all(
    data.map(async (x) => {
      const { items, user } = x;
      return Promise.all(
        items.map((x) =>
          bot.telegram.sendMessage(user.chatId, formatItemString(x)),
        ),
      );
    }),
  );
};

export const job = cron.job({
  cronTime: NOTIFY_CRON,
  onTick: () => {
    searchAndNotify().catch((err) => log.error(err));
  },
});
