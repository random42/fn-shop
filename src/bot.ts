import { Telegraf, Context as C } from 'telegraf';
import dotenv from 'dotenv';

import db, { User, Prisma } from './db';
import log from './log';
import { SetOptional } from 'type-fest';
import _ from 'lodash';

interface Context extends C {
  user: User & { admin: boolean };
}

export const bot = new Telegraf<Context>(process.env.TG_TOKEN);

const ADMINS = ['random41'];

const getUserFromCtx = (ctx: Context) => {
  const { from } = ctx;
  return {
    tgId: from.id,
    username: from.username,
    chatId: ctx.chat.id,
  };
};

export async function setupBot() {
  bot
    .use((ctx, next) => {
      if (ctx.chat.type !== 'private') {
        log.info('not_private');
        throw 'not_private';
      }
      log.info('private');
      return next();
    })
    .use(async (ctx, next) => {
      log.info('user');
      const user = await db.user.findUnique({
        where: { tgId: getUserFromCtx(ctx).tgId },
      });
      ctx.user = {
        ...user,
        admin: ADMINS.includes(user.username),
      };
      return next();
    })
    .start(async (ctx) => {
      const createUser = getUserFromCtx(ctx);
      log.info(createUser, 'start');
      await db.user.upsert({
        create: createUser,
        update: createUser,
        where: { tgId: createUser.tgId },
      });
      // log.info(user)
    })
    .command('/item', async (ctx) => {
      log.info('item');
      const search = ctx.message.text.replace('/item', '').trim();
      if (!search) {
        ctx.reply('need a search string');
      }
      const data = {
        search,
        userId: ctx.user.id,
      };
      const item = await db.itemSearch.upsert({
        create: data,
        where: {
          userId_search: data,
        },
        update: {},
      });
      log.info(item, 'item');
    })
    .catch((err, ctx) => {
      log.error({ error: err, user: ctx.user });
    });
  process.once('SIGINT', () => {
    log.info('stop');
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // await bot.telegram.sendMessage(chatId, 'ciao zi');

  return bot;
}
