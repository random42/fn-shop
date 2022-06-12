import { Telegraf, Context as C } from 'telegraf';
import dotenv from 'dotenv';

import db, { User, Prisma } from './db';
import log from './log';
import { SetOptional } from 'type-fest';

interface Context extends C {
  user: User;
}

const u1 = '@random42';
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
    .catch((err, ctx) => {
      log.error({ error: err });
    })
    .use((ctx, next) => {
      if (ctx.chat.type !== 'private') {
        log.info('not_private');
        throw 'not_private';
      }
      log.info('private');
      next();
    })
    .start(async (ctx) => {
      const createUser = userFromCtx(ctx);
      log.info(createUser, 'start');
      console.error('log', log.info(ctx));
      const user = await db.user.upsert({
        create: createUser,
        update: createUser,
        where: createUser,
      });
      ctx.user = user;
      log.info(user);
    })
    .use(async (ctx, next) => {
      log.info('ctx.user');
      ctx.user = await db.user.findUnique({
        where: userFromCtx(ctx),
      });
      next();
    })
    .command('/item', async (ctx) => {
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
    .on('message', (ctx) => log.info(ctx.message, 'message'));
  process.once('SIGINT', () => {
    log.info('stop');
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  await bot.launch();
  // await bot.telegram.sendMessage(chatId, 'ciao zi');
  setInterval(() => {});

  return bot;
}

export default tg;
