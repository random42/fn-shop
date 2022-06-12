import axios from 'axios';
import { StoreItem } from './db';

const { FN_API_URL, FN_API_KEY } = process.env;

const api = axios.create({
  baseURL: FN_API_URL,
  headers: {
    ['TRN-Api-Key']: FN_API_KEY,
  },
});

export const getStore = async (): Promise<StoreItem[]> =>
  (await api.get('/store')).data;
