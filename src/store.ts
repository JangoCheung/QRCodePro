export default class Storage {
  static get(key) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      chrome.storage.sync.get(key, (res) => resolve(res[key]));
    });
  }

  static set(key, value) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      chrome.storage.sync.set({ [key]: value }, () => resolve())
    });
  }
}