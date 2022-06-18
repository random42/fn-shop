import { Telegraf, Context as C } from 'telegraf';
import dotenv from 'dotenv';

import db, { User, Prisma } from './db';
import logger from './log';
import { SetOptional } from 'type-fest';
import _, { TemplateExecutor } from 'lodash';

interface Context extends C {
  user: User & { admin: boolean };
}

const bot = new Telegraf<Context>(process.env.TG_TOKEN);

const ADMINS = ['random42'];

const COMMANDS = {
  search: {
    desc: 'Get notified when an item that matches your query is on the Fornite item shop',
  },
  clear: {
    desc: 'Clear all your previous searches',
  },
  list: {
    desc: 'List all your searches',
  },
};

const helpMessage = (user: User) => {
  return `Welcome ${
    user.username ? `@${user.username}` : user.firstName
  }! Here's some commands to help you.
${Object.entries(COMMANDS)
  .map(([cmd, data]) => `/${cmd}\t${data.desc}`)
  .join('\n')}`;
};
const getUserFromCtx = (ctx: Context) => {
  const { from } = ctx;
  return {
    id: from.id,
    username: from.username,
    chatId: ctx.chat.id,
    firstName: from.first_name,
    lastName: from.last_name,
  };
};

export async function setupBot() {
  const log = logger.child({ ctx: 'bot' });
  bot
    .use((ctx, next) => {
      if (ctx.chat.type !== 'private') {
        log.info('not_private');
        throw 'not_private';
      }
      return next();
    })
    .use(async (ctx, next) => {
      const user = await db.user.findUnique({
        where: { id: getUserFromCtx(ctx).id },
      });
      if (user) {
        ctx.user = {
          ...user,
          admin: ADMINS.includes(user.username),
        };
      }
      return next();
    })
    .start(async (ctx) => {
      const data = getUserFromCtx(ctx);
      const user = await db.user.upsert({
        create: data,
        update: data,
        where: { id: data.id },
      });
      log.info({ user }, 'start');
      return ctx.reply(helpMessage(user));
    })
    .use(async (ctx, next) => {
      if (!ctx.user) {
        throw 'no user';
      } else return next();
    })
    .command('search', async (ctx) => {
      const search = ctx.message.text.replace('/search', '').trim();
      if (!search) {
        await ctx.reply('I need a query. Try /search sparkplug');
        return;
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
      log.info({ item }, 'search');
    })
    .command('clear', async (ctx) => {
      const { user } = ctx;
      await db.itemSearch.deleteMany({
        where: {
          userId: user.id,
        },
      });
      log.info({ user }, 'clear');
    })
    .command('list', async (ctx) => {
      const { user } = ctx;
      const items = await db.itemSearch.findMany({
        where: {
          userId: user.id,
        },
      });
      log.info({ items }, 'list');
      if (items.length) await ctx.reply(items.map((x) => x.search).join('\n'));
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

export default bot;
