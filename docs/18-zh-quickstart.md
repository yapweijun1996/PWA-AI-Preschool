# 18 — 中文使用与开发说明

## 项目定位

**AI Preschool Studio** 是中性品牌、只用虚构资料的静态 PWA。正式入口是 https://yapweijun1996.github.io/PWA-AI-Preschool/ 。根目录 `index.html` 承载唯一 Studio；`class.html` 只负责跳转到根目录并保留 hash 路由，旧的儿童编辑链接仍可进入相应页面。

当前展示 20 位虚构儿童、四个学习领域、学期比较、浏览器本地自动保存、AI/Mock 草稿、教师本地审核以及儿童/班级打印报告。不要输入真实儿童、家长、员工、照片、声音或工作资料。

## 本地启动

CI 使用 Node 24；没有 npm 依赖，不需要安装步骤。

```sh
npm start
# 打开 http://localhost:4173/
```

开发验收命令（不是本说明声称已通过的结果）：

```sh
npm run check
npm test
npm run build
```

先选择 **Offline mock**，明确显示模拟内容，不会调用 AI。再按需尝试 Demo Gateway 或 OpenAI/Gemini 临时测试 Key。网络或校验失败不会自动替换为 Mock；请检查错误并自行决定重试或切换。

## 保存与安全边界

- 学期记录、占位图片、叙述及来源保存在当前浏览器的 `localStorage`。清除浏览器数据会丢失记录；没有跨设备同步或服务端备份。
- API Key 只在页面内存中短暂使用，不写入浏览器存储，但仍可能被浏览器、扩展或调试工具读取。只用可撤销、受限的测试 Key，不能用生产密钥。
- 本地“已审核”可继续修改，不代表身份认证、正式审批或锁定档案。
- 仅在静态资源成功缓存后才可显示离线就绪。Mock 可离线运行不等于当前版本的断网冷启动已经验收。

## 路由与设计

首页 `#/`、班级 `#/classes`、学生 `#/students`、证据 `#/evidence`、草稿 `#/drafts`、报告 `#/reports`、AI 设置 `#/settings/ai`、隐私说明 `#/about`。编辑器与打印各有独立路由。

[设计 SSOT](../design/README.md) 包含页面规范、WebP 线框图与 tokens；规范决定文案与行为，图片表达视觉意图。公共配置位于 `src/config.js`；`organizationName` 和 `logoUrl` 默认留空，不要写入真实机构身份或秘密。

## 发布与验收

GitHub Pages 使用 **Settings → Pages → Build and deployment → Source → GitHub Actions**。只有获授权的仓库所有者才能 push/deploy。构建只发布白名单运行资源，不发布文档、测试、schema 或 Git 历史。仓库子路径及实际发布验收见[部署说明](09-deployment.md)。

Chrome 安装提示和 Safari 的 **Share → Add to Home Screen** 需要在实际环境另测。更新需要明确同意；页面内存状态与持久化虚构记录应分开说明。真实 iOS、安全区、屏幕阅读器、断网重载、多标签更新、打印与在线 Provider 各自记录证据，不能从桌面模拟或旧测试推断通过。参见 [PWA 验收](25-pwa-standard.md)、[已有展示证据](26-submission-writeup.md)与 [UI 审计](27-ui-audit.md)。

**尚未实现：**真实帐号/权限/租户隔离、应用服务器、数据库、私有图片存储、正式审批锁定、向量 RAG、服务端 PDF、生产 AI 托管、课堂追踪或跨校资料转移。没有已验证的省时、修改率或质量成果。

旧五人长页面示例及其验收资料属于 `legacy-demo-v1` 历史版本，不是当前 Studio 使用说明。
