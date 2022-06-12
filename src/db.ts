export * from '@prisma/client';
import log from './log';
import { PrismaClient, StoreItem, User } from '@prisma/client';
import _ from 'lodash';

const db = new PrismaClient();

export const match = async (
  store: StoreItem[],
): Promise<Record<string, StoreItem>> => {
  type R = Array<User & StoreItem>;
  const data: R = await db.$transaction(async (tdb: PrismaClient) => {
    await tdb.storeItem.deleteMany();
    await Promise.all(store.map((x) => tdb.storeItem.create({ data: x })));
    return tdb.$queryRaw<R>`select si.*, u.* from "StoreItem" si
    join "ItemSearch" i on lower(si.name) like ('%' || lower(i.search) || '%')
    join "User" u on u.id = i."userId"`;
  });
  return _(data)
    .groupBy((x) => x.chatId)
    .entries()
    .map(([chatId, x]) => [
      chatId,
      _.omit(x, ['id', 'username', 'tgId', 'chatId']),
    ])
    .fromPairs()
    .value();
};

export default db;
