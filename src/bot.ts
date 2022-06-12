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
  const { from } = ctx.message;
  return {
    tgId: from.id,
    username: from.username,
    chatId: ctx.chat.id,
  };
};

export async function setupBot() {
  bot
    .catch((err, ctx) => {
      log.error({ error: err, user: ctx.user });
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
      const createUser = getUserFromCtx(ctx);
      log.info(createUser, 'start');
      const user = await db.user.upsert({
        create: createUser,
        update: createUser,
        where: { tgId: createUser.tgId },
      });
      // log.info(user)
    })
    .use(async (ctx, next) => {
      log.info('ctx.user');
      const user = await db.user.findUnique({
        where: { tgId: getUserFromCtx(ctx).tgId },
      });
      ctx.user = {
        ...user,
        admin: ADMINS.includes(user.username),
      };
      return next();
    })
    .command('/item', async (ctx) => {
      log.info(ctx.user, 'item');
      const search = ctx.message.text;
      const item = await db.itemSearch.create({
        data: {
          search,
          userId: ctx.user.id,
        },
      });
      log.info(item);
    });
  // .use((ctx, next) => {
  //   if (!ctx.user.admin) {
  //     throw 'not_admin';
  //   }
  //   return next();
  // })
  // .command('/admin', (ctx) => {
  //   log.info('admin');
  // });
  process.once('SIGINT', () => {
    log.info('stop');
    bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // await bot.telegram.sendMessage(chatId, 'ciao zi');

  return bot;
}
