import React, { Component } from 'react';
import ReactDOM from 'react-dom'

import { Button, Row, Col, Input, List, Popover, message, Tabs } from 'antd';
import { QrcodeOutlined, LinkOutlined, EditOutlined, DeleteOutlined, SaveOutlined, GithubOutlined, CopyOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import QrcodeDecoder from 'qrcode-decoder';
import { get } from 'lodash';

import 'antd/dist/antd.css';
import './index.less';

type TItem = {
  id: string;
  title: string;
  content: string;
};

type TList = Array<TItem>

const STORAGE_KEY = 'qrcodepro';
const { TabPane } = Tabs;
const decoder = new QrcodeDecoder();

class Storage {
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

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = src;
    image.addEventListener('load', (e) => resolve(image));
    image.addEventListener('error', (err) =>  reject(err));
  })
}

class App extends Component {
  currentSelectTab = '';

  state = {
    title: '',
    content: '',
    list: [],
    qrcodePreviewUrl: '',
    decodeUrl: '',
    decodeSuccess: false,
  }

  constructor(props) {
    super(props);
  }

  componentWillMount(){
    document.addEventListener('paste', (e) => {
      if (this.currentSelectTab !== 'deconde') {
        return
      }

      // @ts-ignore
      const clipdata = e.clipboardData || window.clipboardData;

      for (let index = 0; index < clipdata.items.length; index++) {
        const item = clipdata.items[index];
        const type = item.type;

        if (type.indexOf('image/') !== 0) {
          continue;
        }

        const blob = clipdata.files[0];
        const imageUrl = window.URL.createObjectURL(blob);

        this.setState({ qrcodePreviewUrl: imageUrl }, () => this.decodeQRCode());
        return;
      }

      message.error('Clipboard has no Image Data.')
    });
  }

  async componentDidMount(){
    this.init();
    const list = await Storage.get(STORAGE_KEY) as TList;
    this.setState({ list: list || [] });
  }

  init() {
    // @ts-ignore
    if (window.chrome.tabs){
      // @ts-ignore
      window.chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        this.setState({
          title: get(tabs, '[0].title', 'about:blank'),
          content: get(tabs, '[0].url', 'about:blank'),
        }, () => this.onCreate());
      });
    } else {
      this.setState({
        title: document.title,
        content: window.location.href,
      }, () => this.onCreate());
    }
  }

  async createQRCode(target, text) {
    const url = await QRCode.toDataURL(text, {
      width: 200,
      height: 200,
      margin: 0
    });
    // @ts-ignore
    target.src = url;
  }

  onPopoverVisibleChange = (visible, item) => {
    if (visible) {
      // @ts-ignore
      this.createQRCode(document.querySelector('#popoverqrcode_' + item.id), item.content);
    }
  }

  onCreate = () => {
    if (this.state.content) {
      this.createQRCode(this.refs.qrcode, this.state.content);
    }
  }

  onSave = () => {
    if (!this.state.title) {
      message.error('Title Should Not Be Empty.')
      return;
    }

    if (!this.state.content) {
      message.error('Link Should Not Be Empty.')
      return;
    }

    if (this.state.title && this.state.content) {
      this.setState({
        list: [ { id: Date.now(), title: this.state.title, content: this.state.content }, ...this.state.list ]
      }, () => this.sync());
    }
  }

  onDelete = (id) => {
    this.setState({
      list: this.state.list.filter(item => item.id !== id)
    }, () => this.sync());
  }

  onTabsChange = (value) => {
    this.currentSelectTab = value;
  }

  async clipboardWriteText(text) {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copy Success');
    } catch(err) {
      message.error('Copy Error,' + err.message);
    }
  }

  onCopy = (item) => {
    this.clipboardWriteText(item.content);
  }

  sync() {
    Storage.set(STORAGE_KEY, this.state.list);
  }

  async decodeQRCode() {
    try {
      const image = await createImage(this.state.qrcodePreviewUrl);
      const res = await decoder.decodeFromImage(image);

      this.setState({ 
        decodeUrl: res.data ? res.data : '无法解析图片中的二维码',
        decodeSuccess: res.data,
      });
    } catch(err) {
      this.setState({
        decodeSuccess: false,
        decodeUrl: '无法解析图片中的二维码'
      })
    }
  }

  onDropImage = () => {
    this.setState({ decodeUrl: '', qrcodePreviewUrl: '', decodeSuccess: false })
  }

  onSaveDecodeURL = () => {
    if (this.state.decodeUrl !== '' && this.state.decodeUrl !== '无法解析图片中的二维码') {
      this.setState({
        list: [ { id: Date.now(), title: this.state.decodeUrl, content: this.state.decodeUrl }, ...this.state.list ]
      }, () => this.sync());
    }
  }

  onImportImageFromClipboard = async (e) => {
    e.preventDefault();
    document.execCommand('paste');
  }

  renderList() {
    return [
      <h3 style={{marginTop: 10}}>Local Storage History</h3>,
      <Row gutter={[0, 15]}>
        <Col span={24}>
          <List
            size="small"
            header={null}
            footer={null}
            bordered
            dataSource={this.state.list}
            renderItem={item => (
              <List.Item className="list-item">
                <a className="list-item-content" href="javascript:;" target="_blank" onClick={e => window.open(item.content)}>{item.title}</a>
                <ul className="list-item-action">
                  <li>
                    <Popover
                      placement="left"
                      onVisibleChange={e => this.onPopoverVisibleChange(e, item)}
                      content={<img className="popover-qrcode" id={'popoverqrcode_' + item.id} />}
                    >
                      <QrcodeOutlined />
                    </Popover>
                  </li>
                  <li><LinkOutlined onClick={e => window.open(item.content)}/></li>
                  <li><CopyOutlined onClick={e => this.onCopy(item)}/></li>
                  <li><DeleteOutlined onClick={e => this.onDelete(item.id)}/></li>
                </ul>
              </List.Item>
            )}
          />
        </Col>
      </Row>,
    ]
  }

  render() {
    const { qrcodePreviewUrl, decodeUrl, decodeSuccess } = this.state;

    return [
      <Tabs animated={false} onChange={this.onTabsChange}>
        <TabPane tab="Generate QRCode" key="encode">
          <div className="qrcode-wrap">
            <Row>
              <Col span={10}>
                <img className="qrcode" ref="qrcode" />
              </Col>
              <Col span={14}>
                <Input placeholder="Name" value={this.state.title} onChange={e => this.setState({title: e.target.value})}/>
                <Input.TextArea 
                  rows={5}
                  style={{resize: 'none', marginTop: 10}}
                  value={this.state.content}
                  onChange={e => {
                    this.setState({content: e.target.value}, () => this.onCreate());
                  }}
                />
                <Row style={{marginTop: 10}} gutter={[10, 0]}>
                  <Col span={24}>
                    <Button style={{width: '100%'}} type="primary" onClick={this.onSave}>Save</Button>
                  </Col>
                </Row>
              </Col>
            </Row>
            {this.renderList()}
          </div>
        </TabPane>
        <TabPane tab="Decode QRCode" key="deconde">
          <div className="image-preview">
            {
              qrcodePreviewUrl && [
                <div className="qrcode-preview" style={{backgroundImage: `url(${qrcodePreviewUrl})`}}></div>,
                <Button className="drop-image" type="danger" icon="delete" onClick={this.onDropImage}></Button>,
                decodeSuccess ? <Button className="drop-image save-image" type="primary" icon="save" onClick={this.onSaveDecodeURL}></Button> : null,
              ]
            }
            {
              !qrcodePreviewUrl && (
                <p><Button size="small" type="primary" onClick={this.onImportImageFromClipboard}>点击这里</Button> , 从粘贴板里获取二维码图片</p>
              )
            }
          </div>
          {
            qrcodePreviewUrl && (
              <div style={{ marginTop: 10}}>
                <h3>Decode Info</h3>
                <Input.TextArea 
                  rows={3}
                  style={{resize: 'none'}}
                  value={decodeUrl}
                />
              </div>
            )
          }

          <div style={{marginTop: 10}}>
            {
              this.renderList()
            }
          </div>
        </TabPane>
      </Tabs>,
      <img src="./images/Github.png" className="github-icon" onClick={e => window.open('https://github.com/cowboykx/QRCodePro')}/>
    ]
  }

  // componentWillUnmount(){}
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);