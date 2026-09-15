# 识光 LUMEN — 官网

严格按《识光LUMEN-品牌系统》（V2.0）构建的官网。零依赖、零构建、零网络请求：双击 `index.html` 或任意静态服务即可运行。

## 打开方式

```bash
# 方式一：直接双击 index.html（file:// 亦可完整运行）
# 方式二：本地服务
cd lumen-site
python -m http.server 8899   # http://127.0.0.1:8899/
```

## 视觉合规自查表（对照品牌手册）

| 手册规范 | 实现 |
|---|---|
| 四色：Ink `#0B0B0F` / Paper `#F2F1EC` / Beam `#2B37FF` / Signal `#D4FF00` ≤2% | 全站仅此四色及其透明度档；Signal 每视口至多 1–2 处（状态点 / SHARE 条 / 扫描字） |
| 三族字体：Bahnschrift / Noto Sans SC / Consolas（10px · .18em · 大写） | `style.css` `:root` 逐字照抄手册回退链，零下载 |
| 六档字号 MEGA/H1/H2/H3/BODY/MONO | 逐档实现（clamp 流式） |
| 图形三法则：尺度 / 注释 / 切线 | 出血大字、每版面 mono 注释、0.5–1px 细线切分 |
| GRID 28PX + 中轴（FIG 5.2） | hero 网格 + 中轴线 + 角标坐标注释 |
| 扫描采样层 6PX ON / 3PX OFF（FIG 5.1） | 「采样」区 LUMEN 大字 Signal 条纹，滚动点亮 |
| BANNED 禁用清单 | 全站无圆角、无阴影、无渐变填充、无毛玻璃、无光晕、无 3D、无粒子 |
| IP ORB 三态 | 「形象」区 neutral/scanning/captured 状态机（自动轮播 + 点击切换） |
| VOICE 语调 | 文案全部取自手册 CORE/TYPE/VOICE 页原文；短句、给结论、无感叹号 |

## 交互与动效（均为"仪器感"合规动效）

光圈装配预加载 → 自定义光标（点+延迟环）→ hero 光圈自转（鼠标视差）→ 周期扫描掠线（随机段闪 Signal）→ 内核导语逐字点亮（滚动驱动）→ 切线绘制 → 指标条采样填充（count-up）→ LUMEN 扫描字 → ORB 状态机 → 悬停反色。支持 `prefers-reduced-motion` 全量降级。

## 目录结构

```
lumen-site/
├── index.html
├── assets/
│   ├── css/style.css      # 全部视觉规范（注释标明手册出处）
│   ├── js/main.js         # 零依赖交互
│   └── img/*.svg          # 品牌系统源文件直拷（9 个）
└── README.md
```

## 占位符清单（上线前替换）

| 位置 | 现值 | 说明 |
|---|---|---|
| 联系邮箱 | `index.html` → `mailto:hello@example.com` | 待确认 |
| 采样数据 | `SAMPLED 12,486 QUERIES` / `INDEX 78 · CITED 64 · SHARE 31` | 手册示意数据，正式采样周报产出后替换（页面已注明"示意数据"） |
| 引擎名单 | `CHATGPT / GEMINI / PERPLEXITY / 元宝 / 千问 / DEEPSEEK / 豆包` | 按手册 TYPE 页示例 + 实际监测平台 |
| 域名/备案 | — | 部署时补充 ICP 备案号 |

## 设计参考（融合来源，均为手法借鉴、审美自有）

- 手法参考：[Lenis](https://github.com/darkroomengineering/lenis)（惯性滚动节奏）、GSAP ScrollTrigger 社区的文字点亮/切线绘制模式（本项目以零依赖 IntersectionObserver + rAF 自实现）
- 版式气质：[Awwwards Minimal](https://www.awwwards.com/awwwards/collections/minimal/) 与 [Black & White Websites](https://www.awwwards.com/awwwards_collections/collections/black-and-white-websites/) 合集的暗色极简一脉
- 所有视觉决策最终以《识光LUMEN-品牌系统》手册为准；与参考冲突处以手册为准
