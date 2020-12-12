import QRCode from 'qrcode';
import QrcodeDecoder from 'qrcode-decoder';
import { download } from './tools';

class ContentScript {
  private url: string = '';

  constructor() {
    this.bind();
  }

  async render(text) {
    const url = this.url = await QRCode.toDataURL(text, {
      width: 200,
      height: 200,
      margin: 0
    });
    const tpl = `
      <div style="position: fixed;background-color: rgba(0, 0, 0, 0.3);width: 100%;height: 100%;top: 0;left: 0;z-index: 1000000002;display: flex;align-items: center;justify-content: center;">
        <div style="border-radius: 4px;padding:32px;padding-bottom:20px;background: white;box-shadow: rgba(0, 0, 0, 0.15) 2px 2px 5px;position: relative;">
          <div class="____qrcode_pro_close_btn____" style="cursor:pointer;color:#999;width:20px;height:20px;text-align:center;right:7px;top:7px;position:absolute;font-size:32px;line-height:0.5;font-family:sans-serif;">×</div>
          <div>
            <img style="width: 200px; height: 200px;display: block; margin: auto;" src="${url}"/>
          </div>
          <div style="margin-top: 20px;">
            <div class="____qrcode_pro_download_btn____" style="position: relative;font-weight: 400;white-space: nowrap;text-align: center;background-image: none;border: 1px solid #0000;cursor: pointer;transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);user-select: none;touch-action: manipulation;height: 32px;padding: 0 15px;font-size: 14px;border-radius: 4px;color: #fff;background-color: #1890ff;border-color: #1890ff;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.12);box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);line-height: 32px;">
            下载二维码
            </div>
          </div>
        </div>
      </div>
    `;
    const wrap = document.createElement('div');

    wrap.className = '____qrcode_pro_wrap____';
    wrap.innerHTML = tpl;

    document.body.append(wrap);
  }

  createImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
  
      image.src = src;
      image.crossOrigin = "Anonymous";
      image.addEventListener('load', (e) => resolve(image));
      image.addEventListener('error', (err) =>  reject(err));
    })
  }

  async renderDecoder(imgURL) {
    const image = await this.createImage(imgURL);
    let text = '解析二维码内容失败';

    try {
      const result = await new QrcodeDecoder().decodeFromImage(image);

      text = result.data || '解析二维码内容失败';
    } catch(err) {
    }

    const tpl = `
      <div style="position: fixed;background-color: rgba(0, 0, 0, 0.3);width: 100%;height: 100%;top: 0;left: 0;z-index: 1000000002;display: flex;align-items: center;justify-content: center;">
        <div style="border-radius: 4px;padding:32px;padding-bottom:20px;background: white;box-shadow: rgba(0, 0, 0, 0.15) 2px 2px 5px;position: relative;">
          <div class="____qrcode_pro_close_btn____" style="cursor:pointer;color:#999;width:20px;height:20px;text-align:center;right:7px;top:7px;position:absolute;font-size:32px;line-height:0.5;font-family:sans-serif;">×</div>
          <div style="font-size: 18px;text-align: center;margin-bottom: 20px;font-weight: bold;">解析内容</div>
          <div style="width: 300px;word-break: break-all;line-height: 1.5;font-size: 16px;color: #333333;background-color: #eee;border-radius: 5px;padding: 10px;">${text}</div>
        </div>
      </div>
    `;
    const wrap = document.createElement('div');

    wrap.className = '____qrcode_pro_wrap____';
    wrap.innerHTML = tpl;

    document.body.append(wrap);
  }

  bind() {
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      const message = JSON.parse(request);

      if (message.action === 'CREATE_QRCODE') {
        await this.render(message.data);
      }

      if (message.action === 'DECODE_QRCODE') {
        await this.renderDecoder(message.data);
      }
    });

    document.body.addEventListener('click', (e) => {
      const target = e.target;

      // @ts-ignore
      if (target && target.classList && target.classList.contains('____qrcode_pro_close_btn____')) {
        document.querySelectorAll('.____qrcode_pro_wrap____').forEach((node) => document.body.removeChild(node));
      }

      // @ts-ignore
      if (target && target.classList && target.classList.contains('____qrcode_pro_download_btn____')) {
        download(this.url);
      }
    });
  }
}


new ContentScript();