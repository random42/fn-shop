export * from '@prisma/client';
import log from './log';
import { PrismaClient, StoreItem, User } from '@prisma/client';
import _ from 'lodash';

const db = new PrismaClient();

export const match = async (store: StoreItem[]) => {
  type R = Array<User & StoreItem>;
  const data: R = await db.$transaction(async (tdb: PrismaClient) => {
    await tdb.storeItem.deleteMany();
    await Promise.all(store.map((x) => tdb.storeItem.create({ data: x })));
    return tdb.$queryRaw<R>`select si.*, u.* from "StoreItem" si
    join "ItemSearch" i on lower(si.name) like ('%' || lower(i.search) || '%')
    join "User" u on u.id = i."userId"`;
  });
  const userFields = ['id', 'username', 'chatId', 'firstName', 'lastName'];
  return _(data)
    .groupBy((x) => x.id)
    .entries()
    .map(([userId, x]) => ({
      items: x.map((y) => _.omit(y, userFields)) as StoreItem[],
      user: _.pick(x[0], userFields) as User,
    }))
    .value();
};

export default db;
