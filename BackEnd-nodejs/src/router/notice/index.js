/**
 * 公告模块
 */
const authToken = global.$api.authToken
const { BaseUrl } = require("./config"); // 模块配置
const { router } = require("@/utils"); // 工具类
const { CoNoticeList, CoPublishNotice, CoDeleteNotice, ArcherySendMailBefore, ArcherySendMail, ArcheryAIk, ArcheryAIChat} = require("@/controller/notice"); // 控制器

router.post(BaseUrl + "noticeList", authToken, CoNoticeList); // 查询
router.post(BaseUrl + "publishNotice", authToken, CoPublishNotice); // 发布
router.post(BaseUrl + "deleteNotice", authToken, CoDeleteNotice); // 删除

router.post(BaseUrl + "ArcherySendMailBefore", ArcherySendMailBefore); // 发邮件，通知
router.post(BaseUrl + "archerySendMail", ArcherySendMail); // 发邮件，结果
router.post(BaseUrl + "archeryAIk", ArcheryAIk); // 获取aiapikey
router.post(BaseUrl + "archeryAIChat", ArcheryAIChat); // ai对话
