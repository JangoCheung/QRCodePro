export function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = src;
    image.addEventListener('load', (e) => resolve(image));
    image.addEventListener('error', (err) =>  reject(err));
  })
}

export function getI18N(key: string): string {
  // @ts-ignore
  return chrome.i18n.getMessage(key);
}