import React, { Component } from 'react';
import ReactDOM from 'react-dom'

import { Button, Row, Col, Input, List, Popover, message } from 'antd';
import { QrcodeOutlined, LinkOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import QRCode from 'qrcode'
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

class App extends Component {
  state = {
    title: '',
    content: '',
    list: []
  }

  constructor(props) {
    super(props);
  }

  // componentWillMount(){}

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

  render() {
    return (
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
              <Col span={12}>
                <Button style={{width: '100%'}} type="primary" onClick={this.onCreate}>Create</Button>
              </Col>
              <Col span={12}>
                <Button style={{width: '100%'}} type="primary" onClick={this.onSave}>Save</Button>
              </Col>
            </Row>
          </Col>
        </Row>

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
                  <a className="list-item-content" href="javascript:;" target="_blank" onClick={e => this.onCopy(item)}>{item.title}</a>
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
                    {/* <li><EditOutlined onClick={e => this.onEdit(item)}/></li> */}
                    <li><DeleteOutlined onClick={e => this.onDelete(item.id)}/></li>
                  </ul>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </div>
    )
  }

  // componentWillUnmount(){}
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);