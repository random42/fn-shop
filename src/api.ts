import axios from 'axios';
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
    baseURL: config.url,
    headers: {
      ['TRN-Api-Key']: config.key,
    },
  });

export default api;
