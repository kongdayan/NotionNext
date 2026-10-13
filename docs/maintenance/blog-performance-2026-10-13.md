# Kongwenyan 博客维护和性能检查

2026 年 10 月 13 日检查 `https://kongwenyan.cn` 及 Vercel 的 `kongdayans-projects/notion-next`。旧版首页的服务器 HTML 没有文章卡片，卡片和首屏封面必须等待 JavaScript；文章还有过期图片链接，站点地址缺少协议，Chatbase 挂件报错。这些问题比首页 HTML 的缓存响应更值得优先修复。

## 访问速度的证据

旧版首页的一次 HTTP 请求为 200，TTFB 约 0.58 秒，`x-vercel-cache: HIT`。桌面浏览器的一次观测为 LCP 833 毫秒、CLS 0；390 像素宽度、Fast 4G、CPU 4 倍减速的一次观测为 FCP 844 毫秒、LCP 1536 毫秒。以上是本机实验数据，不能代表中国大陆各运营商或真实用户的第 75 百分位。

旧版首屏封面由 JavaScript 发起请求，使用懒加载且没有高优先级。首页服务器 HTML 中文章卡片数量为 0；浏览器出现 React 418 和 423 水合错误。首页加载及预取约 3.14 MB 解码资源，其中包含两份各约 450 KB 的 Google 中文字体 CSS，以及尚未点击的文章数据。

在相同的手机模拟条件下，对旧版和完成图片修复的新版 Vercel 部署域名各做 3 次绕过浏览器缓存的重载，导航完成后观察 5 秒。以下为中位数；新版此时尚未补入后续的 Speed Insights SDK。

| 项目 | 旧版 | 优化版 |
| --- | ---: | ---: |
| FCP | 1464 ms | 1176 ms |
| LCP | 1896 ms | 1812 ms |
| CLS | 0.042 | 0 |
| 可计量解码资源 | 3.20 MB | 1.67 MB |
| 资源请求数 | 71 | 37 |
| `/_next/data/` 请求数 | 12 | 0 |
| Google 字体 CSS 请求数 | 3 | 0 |
| 首页 HTML 中的文章卡片 | 0 | 9 |

LCP 的改善幅度约 4%，FCP 约 20%，解码资源量约 48%。跨域资源的 Resource Timing 可能不提供体积，解码资源量不是所有资源的实际传输流量；这些数据也是本机实验值，不能当作真实用户 p75。修复后的首页未再出现 React 水合错误或失效封面的 500 响应。

检查开始时，Vercel 的旧版 Speed Insights API 字段显示 `disabledAt` 为 2026 年 9 月 16 日且 `hasData: false`，代码也没有接入 Speed Insights SDK，无法复核此前慢速提示的指标和时间范围。本次补入 `@vercel/speed-insights@2.0.0`，在 Pages Router 的 `_app.js` 加载官方组件。正式站脚本返回 200，实际浏览和搜索导航触发的 `/cac6657bec3d84b6/vitals` 上报返回 200；随后后台显示 7 个事件、桌面 RES 99。新数据包含本次验证访问，样本过少，不能代表长期或大陆用户体验。旧 API 的 `disabledAt` 不能单独当作新版采集开关。

账户为 Hobby。本次使用免费 Speed Insights，没有购买 Plus。根据 Vercel 的 2026 年 9 月版文档，免费额度为团队过去 30 天共享 10,000 个事件，超限暂停采集而不收超额费；免费提供 Real Experience Score，详细 Core Web Vitals 和国家分布属于 Plus。监控数据需要在部署后重新积累，不会补回此前缺失的访问记录。[官方接入说明](https://vercel.com/docs/speed-insights/quickstart)、[当前额度和功能限制](https://vercel.com/docs/speed-insights/limits-and-pricing)。

## Web Analytics 与加载开销

项目原有 `@vercel/analytics@1.6.1` 及组件，但 `ANALYTICS_VERCEL` 默认关闭。本次升级到 2.0.1，使用官方 `@vercel/analytics/next` 适配器，保留单一组件和配置开关，设置 Vercel 的 `NEXT_PUBLIC_ANALYTICS_VERCEL=true`。后台菜单已显示“Disable Web Analytics”，确认统计处于开启状态；没有购买 Pro 或 Plus。

新生产部署中，`/ccf0e72b344259b4/script.js` 返回 200，设置 `defer`，实测压缩正文 2084 字节、解码后 4550 字节。首页和客户端跳转至 `/search/chatgpt` 均触发 `/ccf0e72b344259b4/view`，返回 200，Analytics 后台已显示 2 个访问者、8 次页面浏览，页面列表包含首页和搜索。这些初始数据包含本次验证访问。Analytics 统计访问量、来源与热门页面，Speed Insights 统计加载和交互性能，两者分别工作。

为隔离 Analytics 的开销，对已包含 Speed Insights 的前一个部署和新部署交替各测 3 次。条件为 390×844、Fast 4G、CPU 4 倍减速，绕过浏览器缓存，并在导航后观察 5 秒。以下为中位数：

| 项目 | 开启 Analytics 前 | 开启后 |
| --- | ---: | ---: |
| FCP | 928 ms | 928 ms |
| LCP | 1548 ms | 1548 ms |
| CLS | 0 | 0 |
| 资源请求数 | 38 | 41 |
| 可计量解码资源 | 1,696,015 B | 1,704,379 B |

增加约 8.4 KB 解码资源和 3 个请求，包含 SDK 动态块、统计脚本及上报。此次未观察到明显的首屏退化，但不是零成本，也不能排除其他设备或网络下的影响。Hobby 当前每月包含团队共享的 50,000 个 Web Analytics 事件，超额会暂停采集，不产生额外事件账单。[接入说明](https://vercel.com/docs/analytics/quickstart)、[免费额度](https://vercel.com/docs/analytics/limits-and-pricing)。

## 域名与线路

DNSPod 管理 `kongwenyan.cn` 的 DNS。Vercel 配置检查显示 `misconfigured: false`，没有记录冲突；当前 CNAME 是仍受支持的 `cname.vercel-dns.com`。Vercel 给出的首选记录为 `fc4ed3bddcc096df.vercel-dns-017.com`，状态为 `optional-change`。这是可选的 DNS 维护项，不能保证修改后所有地区都加速。Vercel 项目令牌不包含 DNSPod 账户权限，本次未修改 DNS。

正式域名的冷加载复测出现波动：两次手机模拟的 FCP 分别约 15.39 秒和 10.15 秒，CLS 均为 0；同版本的 Vercel 部署域名 FCP 约 0.9 秒。慢样本的主要等待出现在 CSS、图标字体和 JS 的网络下载，首页 HTML 的 TTFB 仍约 0.20 秒。一份框架 JS 经正式域名下载的一次 curl 结果为 6.67 秒，经部署域名为 1.43 秒；正式域名响应为缓存 HIT。随后启用压缩请求的下载为 2.08 秒。这些观测说明本机到自定义域名的资源传输存在波动，不能仅归因于函数冷启动，也不能把部署域名的成绩当作大陆用户访问正式域名的成绩。

在完成图片修复的正式部署中再次复测，FCP 和 LCP 约 13.88 秒，CLS 约 0.000005；仍观察到正式域名的资源下载波动。Vercel、Notion 和部分外部图片仍涉及跨境访问；目前没有多运营商、不同地区的真实用户样本。

## 已实施的维护

- 合并上游截至 `1c2c24f8` 的 96 个提交，保留 fork 原有的 `public/ads.txt` 定制。上游包含图片代理、签名资源、Notion 工作区识别、字体默认配置等维护。
- Next.js 从线上 15.5.23 升到 15.5.27，配套更新 bundle analyzer、ESLint 配置及 hooks 插件，移除无效的 `swcMinify` 选项。
- 修复 Fukasawa 主题的动态导入，使 Next.js 能在水合前加载主题；首页文章列表直接参与服务器渲染，响应式列数在水合后调整。
- 首张封面在 HTML 中提供真实 URL、预加载和高优先级；固定封面比例，首屏取消入场淡入；优先图片尺寸在服务器和浏览器保持一致。
- 修复折叠菜单初始化时先撑开再收起的问题，避免移动端页头和文章列表发生布局位移。已经失效的 `source.unsplash.com` 随机封面直接使用本地背景图，避免等待 500 响应后再回退和刷新 LCP 候选元素。
- Unsplash 封面直接从其图片 CDN 加载，避免经 Notion 再转发一次，桌面封面压缩到 720 像素。其他需要防盗链代理的图源保留原有处理。
- 关闭默认链接的视口预取，避免进入首页就下载未打开文章；单个重要链接仍可通过 `prefetch` 显式开启。Pages Router 鼠标悬停仍可能触发预取，移动端初始加载实测为 0 个文章数据请求。没有默认下载 Google 网页字体，品牌图标字体按使用情况加载。
- 宠物动画延迟到页面加载完成后的空闲阶段；保留桌面宠物功能。Chatbase 原机器人接口返回 404 并触发脚本异常，默认停用，保留机器人配置。更换有效机器人后可设置 `NEXT_PUBLIC_CHATBASE_ENABLED=true` 恢复。
- 将 Vercel 的 `NEXT_PUBLIC_LINK` 从无协议的 `blog.kongwenyan.cn` 改为 `https://kongwenyan.cn`，同时补齐裸域名的 URL 规范化，修复 canonical、RSS、分享及评论地址拼接。
- 补齐 `NEXT_PUBLIC_CONTACT_LINKEDIN` 的 `https://` 协议，修复社交入口跳转到博客内部错误路径的问题。
- 文章标题使用语义化 `h1`，修正 Page 类型封面条件。
- 页面默认 ISR 更新间隔由 60 秒改为 300 秒，减少 Notion 抓取。内容更新可能延迟至下一次刷新；配置 `REVALIDATION_TOKEN` 后可使用 `/api/revalidate` 主动刷新，目前未添加该密钥。
- 锁文件中 681 个依赖原来指向 `registry.npmmirror.com`。下载地址统一改为官方 npm registry，版本和完整性哈希保持不变；Vercel 使用 Yarn 1.22.22 和 frozen lockfile 安装。
- 补齐 Sharp、Clerk React、PostCSS 和 bundle analyzer WebSocket 的修复版本，并修复开发工具中的兼容依赖，包括 proxy-addr、compression、source-map-js、tmp。
- 更新 Vue、glob、minimatch 和 brace-expansion 的兼容修复版本。部署安装使用临时精简清单，保留完整 frozen lockfile，仅安装博客构建需要的依赖，不下载 VitePress、Jest、Lighthouse 等文档和测试工具。
- 将 TypeScript、Tailwind、Sharp 等构建必需依赖归入生产构建清单，并明确声明博客实际使用的 lodash，避免依赖开发工具间接提供它。Next.js 类型检查排除单独的 VitePress 文档和 Cloudflare 函数目录。

## 验证记录

本地 67 个测试套件、369 项测试通过，类型检查通过；改动文件的 ESLint 检查为 0 错误，保留 4 个上游已有的 hooks 依赖警告。精简依赖清单实际安装和生产编译通过，仓库清单与锁文件未被安装脚本修改。

`yarn audit --groups dependencies` 当前仍报告 2 条 moderate 和 2 条 high 路径，均来自 Tailwind 的构建工具链：selector parser 的复杂度告警，以及 braces 深层模式的拒绝服务告警。braces 的告警当时尚无已发布修复版本。这些路径解析仓库中的样式和 glob 配置；本次未跨主版本迁移 Tailwind。数字是依赖路径计数，不是 4 个不同漏洞，也不能据此保证所有可选功能没有风险。

本地生成了全部 64 个静态页面，但导出移动文件时因 `IOS` 和 `iOS` 两个标签发生文件名冲突。默认 Mac 文件系统不区分大小写；Vercel 的 Linux 构建已成功生成 64/64 个页面，两个标签路径均返回 200。这两个标签及 URL 未被删除或合并。

旧版文章“如何分享你的chatgpt对话”的 6 张 Notion 图片返回 419，链接的签名已过期。上游更新已将这类图片映射回稳定附件标识；Vercel 预览部署的 6 张图片均已加载成功。Giscus 和 Utterances 的仓库均为 `kongdayan/blog-comments`，Issues 和 Discussions 已开启，预览中两种评论 iframe 正常加载。两种评论系统都被保留；Giscus 的“尚无讨论”提示会在首次提交评论后创建讨论，不是评论服务故障。

新生产部署 `dpl_CJskFWLdVmmoN7yUiK4pLRtbvg6e` 已为 READY，正式域名已指向源码 `21da75248231dc794eba8a651f9c3c134732c92a`，部署域名为 `notion-next-jzsl1lc9b-kongdayans-projects.vercel.app`。Vercel Linux 构建正常生成 64/64 个页面。首页 HTML 包含 9 张文章卡片；文章图片、归档、分类、两个大小写标签、RSS、sitemap、robots 及 404 均通过前述线上检查。最终加入统计后的首页和搜索再次检查：SDK 与事件接口返回 200，没有 React 水合错误，控制台仅保留 Next.js runtime config 的弃用警告。

## CI 与发布问题

用户提供的失败运行 `38354702036` 并非博客构建失败：依赖安装与 VitePress 构建已成功，最后向 Cloudflare 发布文档时缺少 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，Wrangler 在非交互环境退出。当前 GitHub 仓库没有这两项 Secrets，Vercel 的临时令牌也不包含 Cloudflare 发布权限。

文档工作流现在仍执行构建，并明确检查两项凭据；未配置时只跳过可选的 Cloudflare 发布，在 Actions summary 中记录原因。实际的文档构建错误仍会使 CI 失败。修复后文档工作流运行 `38355236673` 和 Analytics 版本的 `38355909772` 均成功；本次没有发布 Cloudflare 文档站。

Analytics 源码的 [CI 38355909713](https://github.com/kongdayan/NotionNext/actions/runs/38355909713) 和 [CodeQL 38355909704](https://github.com/kongdayan/NotionNext/actions/runs/38355909704) 均成功，CI 包括测试、lint、类型、锁文件一致性和 VitePress 构建。

Docker 镜像发布原来在 push 时自动构建 amd64/arm64，更新代码曾触发该流程并发布到 `ghcr.io/kongdayan/notionnext:main`。Vercel 博客部署不依赖这份容器镜像。用户随后明确要求删除无用镜像，本次已删除 GHCR 的整个 `notionnext` 容器包（含历史版本），GitHub Packages 页面已为空；同时在 GitHub 停用工作流，并从仓库删除 `.github/workflows/docker-ghcr.yaml`，避免后续更新再次构建或推送镜像。网站、Analytics 和 Speed Insights 继续使用此前已验证的 Vercel 生产部署。

## 追加上游同步与提交历史

用户随后要求同步 GitHub 显示落后的 37 个提交。本次 fetch 到上游 `84c3b0cc`，追加合并这些更新，包含 Notion OAuth 凭据保留在服务器端的修复、HEO 评论和目录控件修复，以及依赖和 CodeQL 更新。处理清单和锁文件冲突时，保留 Analytics 2.0.1、Speed Insights 2.0.0、已有性能修复、Vercel 精简安装及 Docker 发布流程删除；保留已经更高的兼容修复版本，依赖下载地址继续统一为官方 npm registry。

追加同步后的本地 70 个测试套件、382 项测试通过，类型检查、lint、VitePress 构建和 frozen lockfile 安装通过。前述性能对照记录来自追加同步前的明确部署版本，不能直接作为新依赖版本的重新测量结果。

fetch 时 fork 的 78 个额外提交中，55 个为合并记录、23 个为普通提交。这个计数反映 Git 历史，不会增加页面资源或让网站变慢。本次常规合并保留历史；若要把 GitHub 的 fork 差异压成 1 个提交，可在最新上游之上创建代码完全相同的单个定制提交，但替换远程 `main` 需要改写历史，应先保留备份并取得明确授权。

## 后续维护

全量依赖扫描仍有开发工具和可选组件的告警，例如 Lighthouse 工具链、Jest、ESLint、VitePress、Waline；本次结果按依赖路径计数为 153 high、88 moderate、1 low、0 critical。兼容补丁已优先应用，但部分告警需要工具链升级或上游发布修复，不宜为清零数字强行跨主版本替换。Vercel 构建不再安装文档和测试工具，保留的开发清单仍应持续维护。

Next.js 已公告计划在 2026 年 10 月 14 日发布新的上游依赖安全修复，发布后还需更新锁文件并重新部署；15.5.27 是本次检查时已发布的 15 系列最新版本。Next.js 16 会移除本项目仍使用的 runtime config，升级 16 需要单独迁移。

建议将内容标签的大小写统一作为一次单独的编辑维护，并为旧 URL 保留兼容路径。重新配置 Chatbase 或选择保留一个评论入口，也应以保留已有评论记录为前提。

## 回滚

旧生产部署为 `notion-next-251qzjc84-kongdayans-projects.vercel.app`，源码提交为 `10462e6994f818c82ea09f19a37cc44e813dda22`。需要回滚时，可在 Vercel 将该部署恢复为生产版本；代码使用新的回滚提交恢复，避免改写 Git 历史。站点地址配置是独立的项目环境变量变更，若要完整恢复旧行为，应同时恢复原值；恢复缺少协议的旧值会再次引入链接拼接问题。

参考：[Next.js 9 月安全修复](https://nextjs.org/blog/september-2026-security-release)、[下一次安全发布公告](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026)、[Vercel 性能指标](https://vercel.com/docs/cli/metrics)、[首屏最大内容优化](https://web.dev/articles/optimize-lcp)。
