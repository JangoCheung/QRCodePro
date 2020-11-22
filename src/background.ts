class Background {
  constructor() {
    this.bind();
  }

  async getActiveTabsId() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function(e) {
        if (e && e.length) {
          resolve(e[0].id);
          return;
        }

        reject(new Error('No Active Tab'));
      })
    });
  }

  postMessage(id, action, data) {
    const message = JSON.stringify({ action, data });

    chrome.tabs.sendMessage(id, message, function(e) {

    });
  }

  bind() {
    chrome.contextMenus.create({
      title: "将选中的文本生成二维码",
      onclick: async (e) => {
        const text = e.selectionText;
        const id = await this.getActiveTabsId();

        this.postMessage(id, 'CREATE_QRCODE', text);
      },
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      title: "将选中的链接生成二维码",
      onclick: async (e) => {
        const text = e.linkUrl;
        const id = await this.getActiveTabsId();

        this.postMessage(id, 'CREATE_QRCODE', text);
      },
      contexts: ["link"]
    })

    // chrome.contextMenus.create({
    //   title: "解析二维码",
    //   onclick: (e) => {
    //     e.srcUrl;
    //   },
    //   contexts: ["image"]
    // });
  }
}

new Background();