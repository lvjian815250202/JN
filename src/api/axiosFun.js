import axios from 'axios';
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: '/api',
    // 超时
    timeout: 1000000
});

service.interceptors.response.use(
    (res) => {
        // 未设置状态码则默认成功状态
        const code = res.data.code || 200;
        // 获取错误信息
        const msg = errorCode[code] || res.data.msg || errorCode['default'];
        // 二进制数据则直接返回
        if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
            return res.data;
        }
        if (code === 401) {
            if (!isRelogin.show) {
                isRelogin.show = true;
                ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
                    confirmButtonText: '重新登录',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                    .then(() => {
                        isRelogin.show = false;
                        store.dispatch('LogOut').then(() => {
                            location.href = '/auth/login.html';
                        });
                    })
                    .catch(() => {
                        isRelogin.show = false;
                    });
            }
            return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
        } else if (code === 500) {
            ElMessage({
                message: msg,
                type: 'error'
            });
            return Promise.reject(new Error(msg));
        } else if (code !== 200) {
            ElNotification.error({
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
        ElMessage({
            message: message,
            type: 'error',
            duration: 5 * 1000
        });
        return Promise.reject(error);
    }
);
// 登录请求方法
const loginreq = (method, url, params) => {
    return axios({
        method: method,
        url: url,
        data: params,
        traditional: true,
        transformRequest: [
            function (data) {
                let ret = ''
                for (let it in data) {
                    ret +=
                        encodeURIComponent(it) +
                        '=' +
                        encodeURIComponent(data[it]) +
                        '&'
                }
                return ret
            }
        ]
    }).then(res => res.data);
};
// 通用公用方法
const req = (method, url, params) => {
    return axios({
        method: method,
        url: url,
        headers: {
            token: localStorage.getItem('logintoken')
        },
        data: params,
        traditional: true,
        transformRequest: [
            function (data) {
                let ret = ''
                for (let it in data) {
                    ret +=
                        encodeURIComponent(it) +
                        '=' +
                        encodeURIComponent(data[it]) +
                        '&'
                }
                return ret
            }
        ]
    }).then(res => res.data);
};
export default service;
// export {
//     loginreq,
//     req,
//     service
// }