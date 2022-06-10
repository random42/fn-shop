import { Mailer } from './mail';
import { promises as fs } from 'fs';
import axios from 'axios';
import _ from 'lodash';
import dotenv from 'dotenv';
import moment from 'moment';

const [arg1] = process.argv.slice(2);
const prettyJson = (x, d = 2) => JSON.stringify(x, null, d);
const readFile = async (fn: string) => (await fs.readFile(fn)).toString();
const readJson = async (fn: string) => JSON.parse(await readFile(fn));
const log = console.error;
const logJson = (x) => log(prettyJson(x));
// const print = console.log;
// const printJson = (x) => print(prettyJson(x));

const axiosErr = (e) =>
  e.isAxiosError ? _.omit(e, ['request', 'response.request']) : e;

dotenv.config();

const {
  FN_BASE_URL,
  FN_API_KEY,
  EMAIL_SERVICE,
  EMAIL_ACCOUNT,
  EMAIL_PWD,
  HOURS_INTERVAL,
} = process.env;

const mailer = new Mailer({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_ACCOUNT,
    pass: EMAIL_PWD,
  },
});

const api = axios.create({
  baseURL: FN_BASE_URL,
  headers: {
    ['TRN-Api-Key']: FN_API_KEY,
  },
});

type Config = Record<string, string[]>;
type StoreItem = {
  imageUrl: string;
  manifestId: number;
  name: string;
  rarity: string;
  storeCategory: string;
  vBucks: number;
};
type Store = StoreItem[];

const getStore = async (): Promise<Store> => (await api.get('/store')).data;

const search = (input: Config, store: Store) => {
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
    .value();
  return out;
};

async function run() {
  const input = await readJson(arg1 || '/dev/stdin');
  const interval = moment.duration(HOURS_INTERVAL, 'seconds').asMilliseconds();
  const matchAndNotify = async () => {
    const store = await getStore();
    const match = search(input, store);
    for (const { email, items } of match) {
      if (items.length) {
        log('email', { email, items });
        await mailer.send(email, 'fn-shop', prettyJson(items));
      }
    }
  };
  const doAndCatch = () => {
    matchAndNotify().catch((e) => log(prettyJson(axiosErr(e))));
  };
  doAndCatch();
  setInterval(doAndCatch, interval);
}

run().catch(log);
