import axios from 'axios';
import _ from 'lodash';
import pino from 'pino';
import path from 'path';
import fs from 'fs-extra';
import * as nodemailer from 'nodemailer';
import type { PartialDeep } from 'type-fest';
import { exec, execSync } from 'child_process';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

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

const axiosErr = (e) =>
  e.isAxiosError ? _.omit(e, ['request', 'response.request']) : e;

type Config = {
  search: {
    [email: string]: string;
  };
  api: {
    url: string;
    key: string;
  };
  email: SMTPTransport.Options;
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
  await execSync('clear');
  const configPath =
    arg1 && (await fs.pathExists(arg1)) ? arg1 : defaultConfigPath;
  let config: Config = await fs.readJSON(configPath);
  config = _.defaultsDeep(defaultConfig(), config);
  const mailer = nodemailer.createTransport(config.email);
  log.info(config);
  await mailer.sendMail({
    to: 'rip.trip.777@gmail.com',
    subject: 'fn-shop',
    text: 'ciao',
  });
  if (1) throw 'xd';
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
    await Promise.all(
      match.map(async ({ email, items }) => {
        log.info({ email, items }, 'match');
        await mailer.sendMail({
          to: email,
          subject: 'fn-shop',
          text: JSON.stringify(items, null, 2),
        });
      }),
    );
  };
  await matchAndNotify();
}

run().catch((e) => log.error(axiosErr(e)));
