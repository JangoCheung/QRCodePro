setTimeout(async () => {
  const list = [
    './libs/react.production.min.js',
    './libs/react-dom.production.min.js',
    './libs/moment.min.js',
    './libs/antd.min.js',
    './libs/icons.js',
    './libs/qrcode.min.js',
    './libs/qrcode-decoder.js',
    './index.js'
  ]
  function load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.src = src;
      script.addEventListener('load', function (e) { resolve(); });
      script.addEventListener('error', function (err) { reject(err); })

      document.head.appendChild(script);
    });
  }

  for (let index = 0; index < list.length; index++) {
    await load(list[index]);
  }
}, 1);
