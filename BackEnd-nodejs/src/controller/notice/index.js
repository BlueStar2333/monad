
const OpenAI = require("openai")
/**
 * 用户模块控制器
 */
const { pool, YES } = require("@/utils");
const Format = global.$api.Format
/**
 * 用户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 返回对象
 * @returns {Void}
 */
// 查询公告列表
const CoNoticeList = (req, res) => {
  let sql = "SELECT * FROM notice ORDER BY date DESC";
  pool.query(sql, (error, result) => {
    if (error) throw error;
    // 判断是否查询到信息
    $api.ReturnJson(res, { code: YES, msg: "查询成功", data: { list: result } });
  });
};

const CoDeleteNotice = (req, res) => {
  $api.PostArg(req).then(({ id }) => {
	  let sql = "DELETE FROM notice WHERE id=?";
    pool.query(sql, [id], (error, result) => {
      if (error) throw error;
      $api.ReturnJson(res, { code: YES, msg: "删除成功" });
    });
	})
};



const CoPublishNotice = (req, res) => {
  $api.PostArg(req).then(({ publisher, publisher_account, details }) => {
    const date = new Date()
    let sql = "INSERT INTO notice(publisher,publisher_account,details,date) VALUES (?,?,?,?)";
    pool.query(sql, [publisher, publisher_account, details, date], (error, result) => {
      if (error) throw error;
      $api.ReturnJson(res, { code: YES, msg: "发布成功", data: result[0] });
    });
	})
};






const fastCsv = require('@fast-csv/format');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const adminEmails = ['1061368119@qq.com','wys19951025@163.com','dulei@scu.edu.cn']
const adminExamineEmails = ['1061368119@qq.com','wys19951025@163.com']
// const adminEmails = ['1061368119@qq.com']
// const adminExamineEmails = ['1061368119@qq.com']

function createCsvDataStream(data) {
    const stream = fastCsv.format({ headers: true });
    data.forEach(row => stream.write(row));
    stream.end();
    return stream;
}


function transformData(tableHead, tableData) {
  return tableData.map(row => {
      return row.reduce((obj, value, index) => {
          obj[tableHead[index]] = value;
          return obj;
      }, {});
  });
}


const ArcherySendMailBefore = (req, res) => {
  $api.PostArg(req).then(({ sqlText, title , name}) => {
    // 发送邮件
    
    async function sendEmailWithCsvAttachment(sqlText, title, name) { // result为0时代表拒绝，为1代表通过
      //开启一个 SMTP 连接池
      var transport = nodemailer.createTransport({
        host : 'smtp.163.com', //QQ邮箱的 smtp 服务器地址
        secure : true, //使用 SSL 协议
        // secureConnection : false, //是否使用对 https 协议的安全连接
        port : 465, //QQ邮件服务所占用的端口
        auth : {
            user : 'chicvsdb@163.com', //开启 smtp 服务的发件人邮箱，用于发送邮件给其他人
            pass : 'LMe67zSv3SjKpPGB' //SMTP 服务授权码
        }
      })
      
      // console.log(resp,2222)
      adminExamineEmails.forEach(item => {
        let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${name}的数据申请已提交，请尽快前往数据平台审核!</p>
                            <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
                            <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                            <img src="https://file.imgcc.cloud/images/2024/11/12/8ca0c32a986eaef33f61099e9ac3bb81.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
        let titleContent = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`
        transport.sendMail({
          from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
          to : item, //收件人
          subject : titleContent, //标题
          html : htmlContent, //正文，可使用 HTML 格式进行渲染
        })
      })
      transport.close(); // 如果没用，则关闭连接池
      $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });

    }
    
    sendEmailWithCsvAttachment(sqlText, title, name);
	})
};

const ArcherySendMail = (req, res) => {
  $api.PostArg(req).then(({ address, tableHead, tableData, sqlText, title , result, name}) => {
    const reqTableHead = JSON.parse(Buffer.from(tableHead, 'base64').toString('utf8'))
    const reqTableData = JSON.parse(Buffer.from(tableData, 'base64').toString('utf8'))
    // 发送邮件
    async function sendEmailWithCsvAttachment(data, address, sqlText, title, result, name) { // result为0时代表拒绝，为1代表通过
      //开启一个 SMTP 连接池
      var transport = nodemailer.createTransport({
        host : 'smtp.163.com', //QQ邮箱的 smtp 服务器地址
        secure : true, //使用 SSL 协议
        // secureConnection : false, //是否使用对 https 协议的安全连接
        port : 465, //QQ邮件服务所占用的端口
        auth : {
            user : 'chicvsdb@163.com', //开启 smtp 服务的发件人邮箱，用于发送邮件给其他人
            pass : 'LMe67zSv3SjKpPGB' //SMTP 服务授权码
        }
      })
    
      // 创建CSV数据流
      const csvStream = createCsvDataStream(data);
      const csvBuffer = [];
    
      // 使用 Promise 包装流处理
      const csvContent = await new Promise((resolve, reject) => {
          csvStream.on('data', chunk => {
              csvBuffer.push(chunk);
            //   console.log('Data chunk received:', chunk.toString());
          });
    
          csvStream.on('end', () => {
            //   console.log('CSV stream ended');
              resolve(Buffer.concat(csvBuffer));
          });
    
          csvStream.on('error', error => {
            //   console.error('CSV stream error:', error);
              reject(error);
          });
      });
    
      // 创建 ZIP 数据流
      const zipStream = archiver('zip', { 
        zlib: { level: 9 }, // 压缩级别
        partSize: 5 * 1024 * 1024 // 每个分卷的大小，单位为字节（这里是5MB）
      });
      
      const zipBuffers = [];
      const filenames = [];
      let currentPart = 1;
      let currentBuffer = [];
      
      // 使用 Promise 包装流处理
      const zipContent = await new Promise((resolve, reject) => {
        zipStream.on('data', chunk => {
          currentBuffer.push(chunk);
          if (currentBuffer.reduce((total, buf) => total + buf.length, 0) >= zipStream.options.partSize) {
            zipBuffers.push(Buffer.concat(currentBuffer));
            filenames.push(`chicsvdb_data.zip.${String(currentPart).padStart(3, '0')}`); // 生成文件名
            currentBuffer = [];
            currentPart++;
            console.log(`Created part${currentPart - 1}`);
          }
        });
      
        zipStream.on('finish', () => {
          if (currentBuffer.length > 0) {
            zipBuffers.push(Buffer.concat(currentBuffer));
            filenames.push(`chicsvdb_data.zip.${String(currentPart).padStart(3, '0')}`); // 生成最后一个分卷的文件名
            console.log(`Created part${currentPart}`);
          }
          resolve({ zipBuffers, filenames });
        });
      
        zipStream.on('error', error => {
          reject(error);
        });
      
        zipStream.append(csvContent, { name: 'data.csv' });
        zipStream.finalize();
      });
    
      let attachmentsContent = []
      zipContent.zipBuffers.forEach((item,index) => {
        attachmentsContent.push({
          filename: zipContent.filenames[index],
          content: item,
          // content: Buffer.from('id,name,email\n1,张1,zhangsan@example.com\n2,李四,lisi@example.com') // 这里可以是Buffer对象，也可以是Stream
      })
      })
    
      let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${result ? '申请已同意，请尽快下载数据!' : '申请已拒绝，请修改后重新提交!' }</p>
                          <p style="color: #333;padding: 10px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;"><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                          <img src="https://file.imgcc.cloud/images/2024/11/12/8ca0c32a986eaef33f61099e9ac3bb81.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
      let titleContent = `【 数据申请结果 】CHICVSDB_数据申请结果_${title}_${Format(new Date())}`
    
      var mailOption = {
        from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
        to : address, //收件人
        subject : titleContent, //标题
        html : htmlContent, //正文，可使用 HTML 格式进行渲染
        attachments: result ? attachmentsContent : null //添加附件
      }
    
      transport.sendMail(mailOption,(err,resp) => {
        if(err){//执行错误
            // console.log(err,456)
            $api.ReturnJson(res, { code: 0, msg: "发送失败", data: 1 });
        } else {
            // console.log(resp,2222)
            adminEmails.forEach(item => {
              let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${name}${result ? '的数据申请已通过管理员审核!' : '的数据申请已被管理员拒绝!' }</p>
                                  <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
                                  <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                                  <img src="https://file.imgcc.cloud/images/2024/11/12/8ca0c32a986eaef33f61099e9ac3bb81.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
              let titleContent = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`
              transport.sendMail({
                from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
                to : item, //收件人
                subject : titleContent, //标题
                html : htmlContent, //正文，可使用 HTML 格式进行渲染
              })
            }, (err,resp) => {})
            $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });
        }     
       transport.close(); // 如果没用，则关闭连接池
      })
    }

    const data = transformData(reqTableHead,reqTableData)
    sendEmailWithCsvAttachment(data, address, sqlText, title, result, name);
	})
};




// var testData = [{
//   name: '张三',
//   old: 14
// },{
//   name: '张9',
//   old: 19
// }]

// async function sendEmailWithCsvAttachment(data, address, sqlText, title, result, name) { // result为0时代表拒绝，为1代表通过
//   //开启一个 SMTP 连接池
//   var transport = nodemailer.createTransport({
//     host : 'smtp.163.com', //QQ邮箱的 smtp 服务器地址
//     secure : true, //使用 SSL 协议
//     // secureConnection : false, //是否使用对 https 协议的安全连接
//     port : 465, //QQ邮件服务所占用的端口
//     auth : {
//         user : 'chicvsdb@163.com', //开启 smtp 服务的发件人邮箱，用于发送邮件给其他人
//         pass : 'LMe67zSv3SjKpPGB' //SMTP 服务授权码
//     }
//   })
  
//   // console.log(resp,2222)
//   adminExamineEmails.forEach(item => {
//     let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${name}的数据申请已提交，请尽快前往数据平台审核!</p>
//                         <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
//                         <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
//                         <img src="https://file.imgcc.cloud/images/2024/11/12/8ca0c32a986eaef33f61099e9ac3bb81.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
//     let titleContent = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`
//     transport.sendMail({
//       from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
//       to : item, //收件人
//       subject : titleContent, //标题
//       html : htmlContent, //正文，可使用 HTML 格式进行渲染
//     })
//   })
//   transport.close(); // 如果没用，则关闭连接池
//   // $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });

// }

// sendEmailWithCsvAttachment(testData,'1061368119@qq.com','select *','我的申请',1,'王豪')



const keyMap = {
  'DeepSeek-V3' : 'sk-1b5ca57b43d94654937ef629a77839e7'
}

// 查询AI模型apikey，加密返回
const ArcheryAIk = (req, res) => {
  
  $api.PostArg(req).then(({ keyType }) => {
    encryptData = global.$api.encrypt(keyMap[keyType])
    $api.ReturnJson(res, { code: YES, msg: "查询成功", data: encryptData });
  })
  
};



const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-1b5ca57b43d94654937ef629a77839e7'
});

// 获取AI回复的异步函数
async function getAiRes(messages) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "deepseek-chat",
      temperature: 0.0,
      top_p: 1,
      frequency_penalty: 0
    });
    // 返回AI回复内容
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("获取AI回复失败:", error);
    throw error; // 抛出错误以便上层捕获
  }
}

// 查询跟AI对话
const ArcheryAIChat = async (req, res) => {
  
  try {
    // 解析请求参数
    const { messages } = await $api.PostArg(req);

    // 获取AI回复
    const aiRes = await getAiRes(messages);

    // 返回成功响应
    $api.ReturnJson(res, { code: YES, msg: "查询成功", data: aiRes });
  } catch (error) {
    // 返回错误响应
    $api.ReturnJson(res, { code: NO, msg: "查询失败", data: error.message });
  }
  
};

module.exports = {
  CoNoticeList, // 查询公告列表
  CoDeleteNotice, // 删除用户
  CoPublishNotice, // 用户信息

  ArcherySendMailBefore, // archery系统发送审核通知接口
  ArcherySendMail, // archery系统发送审核结果接口
  ArcheryAIk, // archery系统获取AI模型的key
  ArcheryAIChat, // archery系统跟ai对话
};
