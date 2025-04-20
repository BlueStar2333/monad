/**
 * 用户模块控制器
 */
const OpenAI = require("openai")
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
// const adminEmails = ['1061368119@qq.com','wys19951025@163.com','dulei@scu.edu.cn']
// const adminExamineEmails = ['1061368119@qq.com','wys19951025@163.com']
const adminEmails = ['1245671957@qq.com']
const adminExamineEmails = ['1245671957@qq.com']

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
                            <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
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
  $api.PostArg(req).then(({ address, sqlText, title , result, name, attachments}) => {
    attachments = attachments == undefined ? [] : attachments
    // 解析并批量转换所有行
    const fileData = attachments.map(item => {
        const buffer = Buffer.from(item.content, 'base64');
        return {
            filename: item.filename,
            content: buffer,  // Node.js 中用 Buffer 替代 BytesIO
            $originalType: item.original_type  // 保留原始类型标记
        };
    });

  async function sendEmailWithCsvAttachment(address, sqlText, title, result, name) {
    // 开启一个 SMTP 连接池
    var transport = nodemailer.createTransport({
      host: 'smtp.163.com', 
      secure: true, 
      port: 465, 
      auth: {
        user: 'chicvsdb@163.com', 
        pass: 'LMe67zSv3SjKpPGB' 
      }
    });
  
    let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${result ? '申请已同意，请尽快下载数据!' : '申请已拒绝，请修改后重新提交!' }</p>
                        <p style="color: #333;padding: 10px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;"><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                        <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`;
    let titleContent = `【 数据申请结果 】CHICVSDB_数据申请结果_${title}_${Format(new Date())}`;
  
    const sendBatchEmails = (fileDataSegments) => {
      fileDataSegments.forEach((segment, index) => {
        let mailOption = {
          from: '"CHICVSDB管理员" <chicvsdb@163.com>',
          to: address,
          subject: titleContent,
          html: htmlContent,
          attachments: segment.length > 0 ? segment : null
        };
  
        transport.sendMail(mailOption, (err, resp) => {
          if(err){
            $api.ReturnJson(res, { code: 0, msg: "发送失败", data: 1 });
          } else if(index === fileDataSegments.length - 1) {
            // 最后一封邮件发送成功后的处理
            adminEmails.forEach(item => {
              let htmlContentAdmin = `<p style="font-weight: 600;padding-bottom: 10px;">${name}${result ? '的数据申请已通过管理员审核!' : '的数据申请已被管理员拒绝!' }</p>
                                      <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
                                      <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                                      <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`;
              let titleContentAdmin = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`;
              transport.sendMail({
                from: '"CHICVSDB管理员" <chicvsdb@163.com>',
                to: item,
                subject: titleContentAdmin,
                html: htmlContentAdmin,
              });
            });
            $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });
          }
        });
      });
    };
  
    if(result && fileData.length > 9) {
      // 分割fileData为多个长度不超过9的数组
      let fileDataSegments = [];
      for(let i = 0; i < fileData.length; i += 9) {
        fileDataSegments.push(fileData.slice(i, i + 9));
      }
      sendBatchEmails(fileDataSegments);
    } else {
      // 直接发送
      let mailOption = {
        from: '"CHICVSDB管理员" <chicvsdb@163.com>',
        to: address,
        subject: titleContent,
        html: htmlContent,
        attachments: result ? fileData : null
      };
      transport.sendMail(mailOption, (err, resp) => {
        if(err){
          $api.ReturnJson(res, { code: 0, msg: "发送失败", data: 1 });
        } else {
          adminEmails.forEach(item => {
            let htmlContentAdmin = `<p style="font-weight: 600;padding-bottom: 10px;">${name}${result ? '的数据申请已通过管理员审核!' : '的数据申请已被管理员拒绝!' }</p>
                                    <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
                                    <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
                                    <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`;
            let titleContentAdmin = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`;
            transport.sendMail({
              from: '"CHICVSDB管理员" <chicvsdb@163.com>',
              to: item,
              subject: titleContentAdmin,
              html: htmlContentAdmin,
            });
          });
          $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });
        }
      });
    }
  
    transport.close(); // 如果没用，则关闭连接池
  }


    // // 发送邮件
    // async function sendEmailWithCsvAttachment(address, sqlText, title, result, name) { // result为0时代表拒绝，为1代表通过
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
    
    //   let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${result ? '申请已同意，请尽快下载数据!' : '申请已拒绝，请修改后重新提交!' }</p>
    //                       <p style="color: #333;padding: 10px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;"><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
    //                       <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
    //   let titleContent = `【 数据申请结果 】CHICVSDB_数据申请结果_${title}_${Format(new Date())}`
    
    //   var mailOption = {
    //     from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
    //     to : address, //收件人
    //     subject : titleContent, //标题
    //     html : htmlContent, //正文，可使用 HTML 格式进行渲染
    //     // attachments: result ? attachmentsContent : null //添加附件
    //     attachments: result ? fileData : null //添加附件
    //   }
    
    //   transport.sendMail(mailOption,(err,resp) => {
    //     if(err){//执行错误
    //         // console.log(err,456)
    //         $api.ReturnJson(res, { code: 0, msg: "发送失败", data: 1 });
    //     } else {
    //         // console.log(resp,2222)
    //         adminEmails.forEach(item => {
    //           let htmlContent = `<p style="font-weight: 600;padding-bottom: 10px;">${name}${result ? '的数据申请已通过管理员审核!' : '的数据申请已被管理员拒绝!' }</p>
    //                               <p style="color: #333;padding: 20px 0 30px;border: 1px dashed rgba(0, 0, 0, .3);border-left:none;border-right:none;">用途说明：<br/><span style="color: #666;">${title}</span>
    //                               <br/><br/>SQL查询脚本：<br/><span style="color: #666;">${sqlText}</span></p><br/>
    //                               <img src="https://pic1.imgdb.cn/item/67fe839d88c538a9b5d1f8ad.png" style="width: 300px;" alt="微信图片 20241112234131" border="0">`
    //           let titleContent = `【 管理员审核通知 】CHICVSDB_数据申请结果_${name}_${Format(new Date())}`
    //           transport.sendMail({
    //             from : '"CHICVSDB管理员" <chicvsdb@163.com>', //发件人
    //             to : item, //收件人
    //             subject : titleContent, //标题
    //             html : htmlContent, //正文，可使用 HTML 格式进行渲染
    //           })
    //         }, (err,resp) => {})
    //         $api.ReturnJson(res, { code: YES, msg: "发送成功", data: 1 });
    //     }     
    //    transport.close(); // 如果没用，则关闭连接池
    //   })
    // }

    sendEmailWithCsvAttachment(address, sqlText, title, result, name);
	})
};




const openai = new OpenAI({
  baseURL: 'https://openapi.coreshub.cn/v1',
  apiKey: 'sk-4iyuMpyI7hjQC6cttiBjSZ7cgpXOoM2eO88upBknB0rK0PTO'
});

// 获取AI回复的异步函数
async function getAiRes(messages) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "DeepSeek-V3",
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



const ChangeArcheryWorkflow = (req, res) => {
  $api.PostArg(req).then(({ audit_id, workflow_title, create_user_display, create_time, workflow_content, workflow_state   }) => {
    // console.log(audit_id, workflow_title, create_user_display, create_time, workflow_content, workflow_state, 999)
		let sqlA = "SELECT * FROM archery_workflow WHERE audit_id = ?"
		pool.query(sqlA, [audit_id], (errorA, resultA) => {
			if (errorA) throw errorA;
      if (resultA.length === 0) {
        let sqlB = "INSERT INTO archery_workflow(audit_id,workflow_title,create_user_display,create_time,workflow_content,workflow_state) VALUES (?,?,?,?,?,?)";
        pool.query(sqlB, [audit_id, workflow_title, create_user_display, create_time, workflow_content, workflow_state], (errorB, resultB) => {
          if (errorB) throw errorB;
          $api.ReturnJson(res, { code: YES, msg: "查询成功", data: resultB });
        });
      } else {
        let sqlC = "UPDATE archery_workflow SET workflow_title = ?,create_user_display = ?,create_time = ?,workflow_content = ?,workflow_state = ? WHERE audit_id = ?";
        pool.query(sqlC, [workflow_title, create_user_display, create_time, workflow_content, workflow_state, audit_id], (errorC, resultC) => {
          if (errorC) throw errorC;
          $api.ReturnJson(res, { code: YES, msg: "查询成功", data: resultC });
        });
      }
		});
	})
};

const SearchArcheryWorkflow = (req, res) => {
  $api.PostArg(req).then(({ audit_id }) => {
		let sql = "SELECT workflow_state FROM archery_workflow WHERE audit_id = ?"
		pool.query(sql, [audit_id], (error, result) => {
			if (error) throw error;
      if (result.length === 0) {
        $api.ReturnJson(res, { code: YES, msg: "查询成功", data: [{workflow_state: null}] });
      } else {
        $api.ReturnJson(res, { code: YES, msg: "查询成功", data: result });
      }
		});
	})
};



module.exports = {
  CoNoticeList, // 查询公告列表
  CoDeleteNotice, // 删除用户
  CoPublishNotice, // 用户信息

  ArcherySendMailBefore, // archery系统发送审核 通知 接口
  ArcherySendMail, // archery系统发送审核结果接口

  ArcheryAIChat, // archery系统跟ai对话

  ChangeArcheryWorkflow,     // 改变申请列表的数据
  SearchArcheryWorkflow,      // 查询申请列表的数据
};
