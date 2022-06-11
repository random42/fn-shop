import { Mailer } from './mail';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import pino from 'pino';
import path from 'path';
import fs from 'fs-extra';
import type { PartialDeep } from 'type-fest';

const [arg1] = process.argv.slice(2);
const defaultConfigPath = path.join(
  process.env.HOME,
  '.config/fn-shop/config.json',
);

const log = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['pid', 'hostname'],
    remove: true,
  },
});

// const logJson = (x) => log(prettyJson(x));
// const print = console.log;
// const printJson = (x) => print(prettyJson(x));

const axiosErr = (e) =>
  e.isAxiosError ? _.omit(e, ['request', 'response.request']) : e;

const {
  FN_BASE_URL,
  FN_API_KEY,
  EMAIL_SERVICE,
  EMAIL_ACCOUNT,
  EMAIL_PWD,
  HOURS_INTERVAL,
} = process.env;

type Config = {
  search: {
    [email: string]: string;
  };
  api: {
    url: string;
    key: string;
  };
  email: {
    service: string;
    user: string;
    pass: string;
  };
};

const defaultConfig = (): PartialDeep<Config> => ({
  api: {
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
  const configPath =
    arg1 && (await fs.pathExists(arg1)) ? arg1 : defaultConfigPath;
  let config: Config = await fs.readJSON(configPath);
  config = _.defaultsDeep(defaultConfig(), config);
  const mailer = new Mailer({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
  const api = axios.create({
    baseURL: config.api.url,
    headers: {
      ['TRN-Api-Key']: config.api.key,
    },
  });
  const getStore = async (): Promise<Store> => (await api.get('/store')).data;
  const matchAndNotify = async () => {
    const store = await getStore();
    const match = search(config.search, store);
    for (const { email, items } of match) {
      log.info({ email, items }, 'match');
      // await mailer.send(email, 'fn-shop', prettyJson(items));
    }
  };
  await matchAndNotify();
}

run().catch((e) => log.error(axiosErr(e)));
