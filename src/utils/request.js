import axios from 'axios';
import { Notification, MessageBox, Message, Loading } from 'element-ui';
// import store from '@/store';
import errorCode from '@/utils/errorCode';

let downloadLoadingInstance;
// 是否显示重新登录
export let isRelogin = { show: false };

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
// 创建axios实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: '/api',
  // 超时
  timeout: 1000000
});



// 响应拦截器
service.interceptors.response.use(
  (res) => {
    // 未设置状态码则默认成功状态
    console.log(res)
    const code = res.data.statusCodeValue || 200;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || errorCode['default'];
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        MessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            isRelogin.show = false;
            // store.dispatch('LogOut').then(() => {
            //   location.href = '/auth/login.html';
            // });
          })
          .catch(() => {
            isRelogin.show = false;
          });
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
    } else if (code === 500) {
      Message({
        message: msg,
        type: 'error'
      });
      return Promise.reject(new Error(msg));
    } else if (code !== 200) {
      Notification.error({
        title: msg
      });
      return Promise.reject('error');
    } else {
      return Promise.resolve(res.data);
    }
  },
  (error) => {
    let { message } = error;
    if (message == 'Network Error') {
      message = '后端接口连接异常';
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时';
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substr(message.length - 3) + '异常';
    }
    Message({
      message: message,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
