# 18 — 中文使用与开发说明

## 项目定位

**AI Preschool Studio** 是可以重复使用、可换品牌的 Browser-first Demo，不属于任何特定幼儿园。默认 `organizationName` 是空字符串，页面没有绑定学校名称。它使用**完全虚构的学生资料**演示约 18 个月的学习观察、AI 成长档案生成、教师修改和打印 PDF。

## 本地启动

```bash
python3 -m http.server 4173
npm run check
npm test
npm run build
```

浏览器打开 `http://localhost:4173`，进入 **AI provider settings**，选择以下其中一个：

- **GPT Demo Gateway（默认）**：通过现有公开 Demo Gateway 申请临时 Session，然后调用 Responses API；实时连通性要另测。
- **OpenAI BYOK**：访客自己输入短期测试用 API Key；只存在这个页面的记忆体；不是生产级安全方案。
- **Gemini BYOK**：同上，而且浏览器可能遇到 CORS 限制。
- **Offline Mock**：不调用 AI；静态文件加载后，不依赖 Gateway、OpenAI 或 Gemini 的实时可用性；必须标明模拟输出。

## 如何换品牌

修改 `src/config.js`：`productName`、`organizationName`、`portfolioTitle` 和 `logoUrl`。`organizationName` 与 `logoUrl` 默认留空。Logo 可指定获授权的公开资源 URL；相对 URL 必须指向已发布的文件（例如 `./favicon.svg`），新增本地资源需加入 `scripts/build.mjs` 白名单。不要把学校名称写死在 HTML、JS 或 SQL 中，公开模板不要包含真实学校 Logo 或资料。

## GitHub Pages

1. 将项目文件提交到中性名称的 GitHub Repository，必须包含 `.github/workflows/pages.yml`。
2. 进入 **Settings → Pages → Build and deployment → Source → GitHub Actions**。
3. 由仓库拥有者**手动 push 已审核的提交到 `main`**；此说明不会自动 push 或部署。也可在 Actions 的 **Static checks and Pages deployment → Run workflow** 中选择 `main`。
4. 等待语法检查、测试、静态构建及 `github-pages` 部署成功，再打开部署页面给出的真实 HTTPS URL，通常为 `https://USERNAME.github.io/REPOSITORY/`。
5. 在真实来源先验证 Offline Mock、证据链接、编辑、审核及打印 PDF，再单独记录 Gateway/BYOK 的实际结果。不能只凭预计 URL 就说已经上线；不应为展示而修改实时 Gateway 配置或关闭访问控制。

PR 只运行只读 CI 检查，不发布 Pages；在非 `main` 分支手动运行也不会发布。`npm run build` 不需要 npm 依赖或 bundler，只把 HTML、CSS、favicon、四个 `src/` 模块和 `.nojekyll` 放入 `dist/`，不会发布文档、测试、schema、历史或密钥。相对路径支持 `/REPOSITORY/`；本地构建及子路径验证命令见 [部署说明](09-deployment.md)。公开 Demo **绝对不能上传真实学生资料**。

## 第一版真正有的功能

虚构学生、观察记录、AI/Mock 草稿、教师审核、修改比例示意、打印 PDF。**没有真正的帐号权限、数据库向量检索、人脸识别、学生跨校转移或家长自动发信**。这些是未来阶段，需要独立设计、测试及合规审查。

## 本人/团队展示注意

先选 Offline Mock 保证展示流畅，再尝试默认 Gateway；讲解每条内容如何跟 Evidence ID 对应。6 小时/学生与少于 10% 修改量只属于示范假设，不应被描述为已验证节省成果。
