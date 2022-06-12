import * as p from '@prisma/client';
export * from '@prisma/client';
import log from './log';

const db = new p.PrismaClient();

export const getChoices = async () => {
  const users = db.user.findMany();
};

const match = (input: Record<string, string>, store: Store) => {
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

export default db;
