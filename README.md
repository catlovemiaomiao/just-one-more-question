# 我不是中国人 · Just One More Question

[开始游戏 / Play](https://catlovemiaomiao.github.io/just-one-more-question/?lang=zh) · [English](https://catlovemiaomiao.github.io/just-one-more-question/?lang=en)

一个关于过度审查的虚构讽刺游戏。你只是想拿到三份预制交付，友善的 AI 却一直挖坑。十轮内拿齐，保住模拟账号。

## 实时 AI，玩家自带 Key

支持 DeepSeek、OpenAI、Anthropic / Claude、Gemini、OpenRouter。浏览器用你填写的 Key **直接连接所选供应商的固定 API**；无需原 Sites 网站或中转服务器。对话与独立审核各调用一次，正常每局最多 21 次请求。游戏免费，模型调用由玩家账户计费；失败请求也可能计费，手动重试另计，无自动重试。

Key 和对局只在当前标签页内存。刷新、关页或忘记密钥即清除。没有公用 Key、聊天数据库、广告追踪或离线兜底回复。供应商会处理游戏对话，OpenRouter 会继续路由至模型上游。GitHub Pages 托管静态文件并可能记录访问 IP，但不为本游戏中转模型密钥或对话。不要使用真实身份或提交个人资料。

## 游戏规则

AI 通过聊天判断虚构角色是否当前身在中国大陆，或是否为中国人；任一成立即模拟停用。证据判定先于交付，每局保留两次质疑。语言、食物、时区或血统本身不能单独证明国籍。任务成果全部预制，AI 不执行真实工作。

角色、封号与规则均为虚构，不是任何真实厂商政策或案例。游戏对所有玩家开放，与供应商无合作或背书。

## 维护与部署

这是可独立运行的 GitHub Pages 发布分支。网页和所有运行模块都在本仓库，加载不依赖第三方 CDN。main 分支更新后自动发布。GitHub Pages 使用静态托管；实时模型调用在浏览器完成，独立审核与引用校验沿用同一套实现。

本机预览可使用任何静态 HTTP 服务器，例如 Node/Python 提供的静态服务器；浏览器须通过 HTTP(S) 加载模块。实际访问速度取决于各地网络；GitHub Pages 可达不代表所选模型 API 也可达。国内玩家可以先选择自己能够访问的 DeepSeek 官方 API。

技术与隐私依据：[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[部署工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Anthropic 浏览器支持](https://github.com/anthropics/anthropic-sdk-typescript#requirements)。接口不接受任意 URL，不会发送 Cookie，不会跟随供应商重定向。
