# 18 — 中文使用与开发说明

## 项目定位

**AI Preschool Studio** 是可以重复使用、可换品牌的 Browser-first Demo，不属于任何特定幼儿园。默认 `organizationName` 是空字符串，页面没有绑定学校名称。它使用**完全虚构的学生资料**演示约 18 个月的学习观察、AI 成长档案生成、教师修改和打印 PDF。

## 本地启动

```bash
python3 -m http.server 4173
npm run check
npm test
```

浏览器打开 `http://localhost:4173`，进入 **AI provider settings**，选择以下其中一个：

- **GPT Demo Gateway（默认）**：通过现有公开 Demo Gateway 申请临时 Session，然后调用 Responses API；实时连通性要另测。
- **OpenAI BYOK**：访客自己输入短期测试用 API Key；只存在这个页面的记忆体；不是生产级安全方案。
- **Gemini BYOK**：同上，而且浏览器可能遇到 CORS 限制。
- **Offline Mock**：不调用 AI，始终可供展示；必须标明模拟输出。

## 如何换品牌

修改 `src/config.js`：`productName`、`organizationName`、`portfolioTitle`。不要把学校名称写死在 HTML、JS 或 SQL 中。Logo/颜色未来可以扩展成 tenant configuration。

## GitHub Pages

将 ZIP 解压并把项目文件上传至新的 GitHub Repository。进入 Settings → Pages → Deploy from a branch → main → root。检查真实 URL 是否能访问，不能只凭预计 URL 就说已经上线。公开 Demo **绝对不能上传真实学生资料**。

## 第一版真正有的功能

虚构学生、观察记录、AI/Mock 草稿、教师审核、修改比例示意、打印 PDF。**没有真正的帐号权限、数据库向量检索、人脸识别、学生跨校转移或家长自动发信**。这些是未来阶段，需要独立设计、测试及合规审查。

## 本人/团队展示注意

先选 Offline Mock 保证展示流畅，再尝试默认 Gateway；讲解每条内容如何跟 Evidence ID 对应。6 小时/学生与少于 10% 修改量只属于示范假设，不应被描述为已验证节省成果。
