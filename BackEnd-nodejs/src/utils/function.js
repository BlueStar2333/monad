/*!
 * Copyright (c) Author biaov<biaov@qq.com>
 * Date 2020-03-05
 */

(function (global) {
  const path = require("path"); // 引入路径模块
  const { PublicPath, NO } = require("./variable"); // 引入全局变量
  const crypto = require("crypto"); // 引入crypto模块
  const jwt = require('jsonwebtoken');
  const secretKey = 'huaxiyiyuandiyform@2024@2333';

  
function generateToken(data = { userId: 'user_id' }) {
  return jwt.sign(data, secretKey, { expiresIn: '1h' });
}
function refreshT(token) {
  let data = ''
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(406).json({ message: 'Failed to refresh the token' });
    data = {
      account: decoded.account,
      password: decoded.password
    }
  })
  return jwt.sign(data, secretKey, { expiresIn: '1h' });
  //return jwt.sign(data, secretKey, { expiresIn: '10s' });
}

function authToken(req, res, next) {
  const token = req.headers['x-token'];
  if (!token) return res.status(407).json({ message: 'Unauthorized' });
 
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(406).json({ message: 'Invalid token' });
    next();
  });
}





  /**
   * 时间转换
   * @param {String|Date} time - 时间格式
   * @returns {String}
   */
  const Format = time => {
    let t = new Date(time); // 创建Date对象
    let Y = t.getFullYear(); // 年
    let M = t.getMonth() + 1; // 月
    let D = t.getDate(); // 日
    let h = t.getHours(); // 时
    let m = t.getMinutes(); // 分
    let s = t.getSeconds(); // 秒
    M = M < 10 ? "0" + M : M;
    D = D < 10 ? "0" + D : D;
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
  };

  /**
   * POST请求接收参数
   * @param {Object} req - 请求对象
   * @returns {Object} - Promise Object
   */
  const PostArg = req => {
    return new Promise(resolve => {
      let data = "";
      //注册data事件接收数据
      req.on("data", chunk => {
        // chunk 默认是一个二进制数据，和 data 拼接会自动 toString
        data += chunk;
      });
      req.on("end", () => {
        resolve(JSON.parse(data));
      });
    });
  };

  /**
   * 加密,解密
   * @param {Object} data - 需要加密的数据
   * @param {Boolean|undefined} [type=false] - 判断是加密还是解密，type：true为解密，false为加密
   * @param {String} [password=123456] - 加密数据的密码
   * @returns {String|Object} - 返回加密，解密结果
   */
  const AseEnDecode = (data, type = false, password = "123456") => {  
    const salt = crypto.randomBytes(16); // 生成盐值  
    const key = crypto.pbkdf2Sync(password, salt, 100000, 24, 'sha512'); // 派生密钥  
    
    if (!type) {  
      // 加密  
      if (typeof data !== 'object' || data === null) throw new Error(data + " is not an object");  
      data = JSON.stringify(data);  
    
      // 生成随机的 IV  
      const iv = crypto.randomBytes(16);  
    
      // 创建 cipher 对象  
      const cipher = crypto.createCipheriv("aes-192-cbc", key, iv);  
    
      // 加密数据  
      let encrypted = cipher.update(data, "utf8", "hex");  
      encrypted += cipher.final("hex");  
    
      // 返回包含 salt, iv 和加密数据的对象  
      return { salt: salt.toString('hex'), iv: iv.toString('hex'), encryptedData: encrypted };  
    } else {  
      // 解密（注意：这里假设 data 已经是一个包含 salt, iv 和 encryptedData 的对象）  
      if (typeof data !== 'object' || !data.salt || !data.iv || !data.encryptedData) {  
        throw new Error("Decryption data is invalid");  
      }  
    
      const key = crypto.pbkdf2Sync(password, Buffer.from(data.salt, 'hex'), 100000, 24, 'sha512');  
      const iv = Buffer.from(data.iv, 'hex');  
    
      // 创建 decipher 对象  
      const decipher = crypto.createDecipheriv("aes-192-cbc", key, iv);  
    
      // 解密数据  
      let decrypted = decipher.update(data.encryptedData, "hex", "utf8");  
      decrypted += decipher.final("utf8");  
    
      // 返回解密后的对象  
      return JSON.parse(decrypted);  
    }  
  };
  // const AseEnDecode = (data, type = false, password = "123456") => {
  //   // 判断是加密还是解密，type：true为解密，false为加密
  //   if (!type) {
  //     // 加密
  //     if (Object.prototype.toString.call(data) !== "[object Object]") throw new Error(data + "is not Object");
  //     data = JSON.stringify(data);
  //     // 创建cipher对象
  //     const cipher = crypto.createCipher("aes192", password);
  //     // 指定被加密的数据
  //     let crypted = cipher.update(data, "utf-8", "hex");
  //     crypted += cipher.final("hex");
  //     return crypted.toString();
  //   } else {
  //     // 解密
  //     if (Object.prototype.toString.call(data) !== "[object String]") throw new Error(data + "is not String");
  //     // 创建 decipher对象
  //     const decipher = crypto.createDecipher("aes192", password);
  //     // 指定需要被解密的数据
  //     let decrypted = decipher.update(data, "hex", "utf-8");
  //     decrypted += decipher.final("utf-8");
  //     return JSON.parse(decrypted);
  //   }
  // };

  /**
   * 获取随机默认头像
   * @returns {String} - 头像地址
   */
  const RandomAvatar = () => {
    const randomNum = Math.ceil(Math.random() * (8 - 1)) + 1;
    return PublicPath + "images/avatar/" + randomNum + ".png";
  };

  /**
   * 分页参数转化成数字
   * @param {Any} requireNum - 需要转化的数字
   * @param {Number} defaultNum - 默认值
   * @returns {Number} - 转化后的数字
   */
  const ConvertNum = (requireNum, defaultNum) => {
    // 判断defaultNum是否为数字
    if (Object.prototype.toString.call(defaultNum) === "[object Number]") {
      // 防止requireNum为undefined,负数,小数,NaN
      // Math.abs是为了防止传递负数，parseInt是把传递的数据转为数字或者NaN，||短路逻辑为了防止NaN
      return Math.abs(parseInt(requireNum)) || defaultNum;
    } else {
      throw new Error(`${defaultNum} is not number`);
    }
  };

  /**
   * 验证token是否正确
   * @param {String} token - token值
   * @returns {Object} - Promise Object
   */
  const VerifyToken = (token, res) => {
    return new Promise(resolve => {
      // 返回token错误
      function TokenError(res) {
        res.json({ code: NO, msg: "token错误", data: null }); // 返回前端数据
      }
      // 判断token是否传递
      if (Object.prototype.toString.call(token) === "[object String]" && token.trim().length !== 0) {
        const { userId } = AseEnDecode(token, true);
        // 判断是否存在userId
        if (!userId) {
          TokenError(res);
        } else {
          resolve(userId);
        }
      } else {
        TokenError(res);
      }
    });
  };

  /**
   * 返回响应JSON数据
   * @param {Object} res - 响应对象
   * @param {Object} [obj={}] - json对象
   */
  const ReturnJson = (res, obj = {}) => {
    let { code = NO, msg = "参数错误", data = null } = obj;
    res.json({ code, msg, data });
  };
  /**
   * 保存验证对象数据
   * @param {Any} - 需要改变的值
   * @param {Object} [obj={}] - 需要添加的对象
   * @returns {Object} - 返回一个对象
   */
  const SaveValidData = (validData, obj = {}) => {
    // 获取一个新对象
    let value = Object.prototype.toString.call(validData) === "[object Object]" ? validData : {};
    // 循环遍历把需要保存的值放到新对象中去
    for (const key in obj) {
      value[key] = obj[key];
    }
    return value;
  };

  // 转换为特定时区的时间
  const convertToTimeZone = (date, timeZone) => {
    date = new Date(date)
    const offset = date.getTimezoneOffset() + timeZone * 60; // 转换为分钟
    return new Date(date.getTime() + offset * 60000); // 转换为毫秒
  }
  // 设置为东部时区，比UTC晚5小时
  // const easternDate = convertToTimeZone(utcDate, 5)
  global.$api = {
    Format, // 时间转换
    PostArg, // POST请求接收参数
    AseEnDecode, // 加密,解密
    RandomAvatar, // 获取随机默认头像
    ConvertNum, // 分页参数转化成数字
    VerifyToken, // token验证
    ReturnJson, // 返回响应JSON数据
    SaveValidData, // 保存验证对象数据
    convertToTimeZone,
    generateToken,
    refreshT,
    authToken
  };
})(global);
