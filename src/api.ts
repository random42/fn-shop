import axios from 'axios';

const { FN_API_URL, FN_API_KEY } = process.env;

type StoreItem = {
  imageUrl: string;
  manifestId: number;
  name: string;
  rarity: string;
  storeCategory: string;
  vBucks: number;
};
type Store = StoreItem[];

const api = (config) =>
  axios.create({
    baseURL: FN_API_URL,
    headers: {
      ['TRN-Api-Key']: FN_API_KEY,
    },
  });

export default api;
