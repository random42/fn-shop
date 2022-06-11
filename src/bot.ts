import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const { TOKEN } = process.env;

const user = '@random42';
const chatId = '321311233';

async function run(token: string) {
  const bot = new Telegraf(token);
  bot.start((ctx) => ctx.reply('bella zi'));
  bot.on('message', (ctx) => ctx.reply(ctx.message.chat.id + ''));
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  bot.launch();
  // const chat = await bot.telegram.getChat(user);
  // console.log(chat);
  setTimeout(() => bot.telegram.sendMessage(chatId, 'ciao zi'), 1000);
}

run(TOKEN).catch(console.error);
