export type TItem = {
  id: string;
  title: string;
  content: string;
};

export type TList = Array<TItem>;

export const STORAGE_KEY = 'qrcodepro';