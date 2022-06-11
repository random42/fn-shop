import { Telegraf, Context as C } from 'telegraf';
import dotenv from 'dotenv';

import db, { User, Prisma } from './db';
import log from './log';
import { SetOptional } from 'type-fest';

interface Context extends C {
  user: User;
}

const user = '@random42';
const chatId = '321311233';
const userFromCtx = (ctx: Context) => {
  const { from } = ctx.message;
  return {
    tgId: from.id,
    username: from.username,
    chatId: ctx.chat.id,
  };
};

async function tg(token: string) {
  const bot = new Telegraf<Context>(token);
  const i = 0;

  bot
    .use((ctx) => {
      if (ctx.chat.type !== 'private') {
        log.debug('not_private');
        throw 'not_private';
      }
      log.debug('private');
    })
    .start(async (ctx) => {
      log.debug('start');
      ctx.reply('bella zi');
      console.error(log.info(ctx));
      ctx.reply(ctx.message.chat.id + '');
      const createUser = userFromCtx(ctx);
      const user = await db.user.upsert({
        create: createUser,
        update: createUser,
        where: createUser,
      });
      ctx.user = user;
      log.info(user);
    })
    .on('message', (ctx) => log.debug(ctx.message))
    .use(async (ctx) => {
      log.debug(ctx, 'use');
      ctx.user = await db.user.findUnique({
        where: userFromCtx(ctx),
      });
    })
    .command('item', async (ctx) => {
      log.info('item');
      const search = ctx.message.text;
      const item = await db.itemSearch.create({
        data: {
          search,
          userId: ctx.user.id,
        },
      });
      log.info(item);
    })
    .catch((err, ctx) => {
      log.error({ error: err, ctx });
    });
  process.once('SIGINT', () => {
    log.debug('stop');
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  await bot.launch();
  await bot.telegram.sendMessage(chatId, 'ciao zi');

  return bot;
}

export default tg;
