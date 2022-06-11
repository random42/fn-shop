import axios from 'axios';
import _ from 'lodash';
import pino from 'pino';
import path from 'path';
import fs from 'fs-extra';
import type { PartialDeep } from 'type-fest';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import log from './log';
import tg from './bot';

const [arg1] = process.argv.slice(2);
const defaultConfigPath = path.join(
  process.env.HOME,
  '.config/fn-shop/config.json',
);

const axiosErr = (e) =>
  e.isAxiosError ? _.omit(e, ['request', 'response.request']) : e;

type Config = {
  fn: {
    url: string;
    key: string;
  };
  tg: { token: string };
};

const defaultConfig = (): PartialDeep<Config> => ({
  fn: {
    url: 'https://api.fortnitetracker.com/v1',
  },
});

type StoreItem = {
  imageUrl: string;
  manifestId: number;
  name: string;
  rarity: string;
  storeCategory: string;
  vBucks: number;
};
type Store = StoreItem[];

const search = (input: Record<string, string>, store: Store) => {
  const fields = ['name'];
  const out = _(input)
    .entries()
    .map(([email, reg]) => {
      const items = _(reg)
        .map((r) => {
          const reg = new RegExp(r, 'i');
          const items = store.filter((s) => fields.some((f) => reg.test(s[f])));
          return items;
        })
        .flatten()
        .uniq()
        .value();
      return { email, items };
    })
    .filter((x) => x.items.length > 0)
    .value();
  return out;
};

async function run() {
  console.clear();
  const configPath =
    arg1 && (await fs.pathExists(arg1)) ? arg1 : defaultConfigPath;
  let config: Config = await fs.readJSON('data/config.json');
  config = _.defaultsDeep(defaultConfig(), config);
  const bot = await tg(config.tg.token);
  process.on('exit', () => {
    log.debug('exit');
  });
  log.info('run');
  // if (1) throw 'xd';
  // const api = axios.create({
  //   baseURL: config.api.url,
  //   headers: {
  //     ['TRN-Api-Key']: config.api.key,
  //   },
  // });
  // const getStore = async (): Promise<Store> => (await api.get('/store')).data;
  // await matchAndNotify();
}

run().catch((e) => log.error(axiosErr(e)));
