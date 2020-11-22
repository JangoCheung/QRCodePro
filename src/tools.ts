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

export function download(src, name = '二维码.png') {
  const e = function(src) {
    var n = src.split(";base64,");
    var e = n[0].split(":")[1];
    var r = window.atob(n[1])
    var o = r.length;
    var i = new Uint8Array(o);
    var c = 0;
    for (; c < o; ++c) {
      i[c] = r.charCodeAt(c);
    }
    
    return new Blob([i],{ type: e });
  };

  const r = document.createElement("a")
  const o = e(src)
  const i = document.createEvent("HTMLEvents");

  i.initEvent("click", !0, !0);
  r.download = name;
  r.href = URL.createObjectURL(o);
  r.click();
}