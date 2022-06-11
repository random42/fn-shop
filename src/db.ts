import * as p from '@prisma/client';
export * from '@prisma/client';
import log from './log';

const db = new p.PrismaClient();

export const getChoices = async () => {
  const users = db.user.findMany();
};

export default db;
