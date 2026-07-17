# 回归分析可视化工具：代码结构与实现综述

本文档面向后续维护与二次开发人员，对项目的代码结构、业务逻辑与关键技术实现进行系统性梳理。内容分为三个核心模块：

1. 程序设计思路模块（架构/分层/模块化/技术栈/设计模式）
2. 核心算法逻辑模块（算法拆解：输入输出、步骤、边界条件）
3. 程序功能介绍模块（按业务优先级：场景、交互、依赖、权限）

项目为纯前端静态站点，核心目标是以“可拖拽、可变换、可解释”的方式帮助理解一元线性回归、相关系数、决定系数与变异分解等概念。

---

## 1. 程序设计思路模块

### 1.1 架构选型与依据

**选型：原生 HTML + CSS + ES Module + ECharts + KaTeX**

- 原生 ES Module：无需构建链路，降低教学演示与分发成本；模块天然形成边界（导入/导出），利于维护。
- ECharts：成熟的二维坐标系、Canvas 渲染与交互能力（尤其是 `graphic` 拖拽层、坐标转换 API），适合“拖拽点→实时反馈”的高频交互场景。
- KaTeX：数学公式渲染性能稳定，适合实时刷新统计公式或标签。

### 1.2 分层设计逻辑（Functional Core + Imperative Shell）

项目采用“数据驱动刷新”的结构：所有 UI 都由 `state.points` 派生出来。

- **核心数据层（State）**：全局单例状态 `state`，只保存“事实数据”（点坐标、交互模式、缩放比例）以及由 `update()` 计算得到的派生统计结果。
- **纯计算层（Functional Core）**：`statistics.js`、`regression.js`、`utils.js` 提供可复用、可验证的纯函数（或近似纯函数）。
- **渲染/交互层（Imperative Shell）**：`chart.js`、`ui.js`、`table.js`、`interaction.js` 将状态映射为 DOM/ECharts 展示，并把用户操作回写到 `state.points`。

统一刷新管线由 `app.js` 的 `update()` 串联，形成单一事实来源与单一刷新入口。

```mermaid
flowchart LR
  User[用户交互: 拖拽/增删/调R/缩放/随机生成] -->|只改 state.points 或交互态| State[state.js]
  State --> Update[app.js:update()]
  Update --> Stats[statistics.js:calculateStatistics]
  Stats --> Reg[regression.js:calculateRegression]
  Reg --> Chart[chart.js:updateChart + 分解图]
  Reg --> UI[ui.js:updateStatsUI + Venn + ANOVA]
  Reg --> Table[table.js:updateTable]
```

### 1.3 模块化拆分原则

按“职责稳定性”拆分模块，减少相互耦合：

- `state.js`：只描述数据结构，不包含业务计算。
- `statistics.js / regression.js`：只做数学计算，不触碰 DOM，不依赖 ECharts。
- `chart.js`：只关心图表实例与图形交互（含分解图），不直接计算统计量。
- `ui.js`：只负责把统计结果渲染到右侧面板与 Venn 图，不参与回归计算。
- `interaction.js`：只负责事件绑定与“操作→改 state →触发 update()”。
- `sampling.js`：抽样模拟子系统自成闭环，不影响主回归流程。

### 1.4 技术栈选型理由（面向业务需求）

- **实时反馈**：拖拽点、滑块调 R 等都需要毫秒级视觉响应。ECharts Canvas + 局部 setOption 更新适合此场景。
- **视觉-数学一致性**：项目强调“坐标轴 1:1”的物理比例，避免斜率在视觉上被拉伸误导；此类需求在 ECharts 的 grid/axis 配合下可控。
- **教学可解释性**：用 Venn 图将 $R^2$ 解释为“可解释变异比例”，以及用变异分解图把 SSR/SSE 具象化，满足“概念—图形—公式”一致呈现。

### 1.5 核心设计模式与应用场景

- **Single Source of Truth（单一事实源）**：`state.points` 是唯一事实数据，所有统计/图表/表格都从它派生。
- **Pipeline（流水线/管线）**：`update()` 固化“统计→回归→渲染”的顺序，避免多处重复计算与 UI 不一致。
- **Observer-like 回调**：`initChart(container, update)` 把 `update` 作为回调传入，拖拽等事件只负责触发 update。
- **策略/状态机（Interaction Mode）**：`state.interactionMode` 作为模式开关（drag/add/delete），`chart.js` 根据模式切换 `graphic` 行为。

---

## 2. 核心算法逻辑模块

本模块按“输入/输出/步骤/边界条件”拆解项目中关键算法与流程。

### 2.1 描述性统计计算（均值/方差/协方差/相关）

**位置**：`statistics.js: calculateStatistics(points)`

**输入**
- `points: Array<{x:number,y:number}>`

**输出**
- `statistics: { meanX, meanY, sumSqX, sumSqY, sumXY, varianceX, varianceY, covariance, sdX, sdY, r }`

**核心步骤（概念）**
1. 计算均值 `meanX, meanY`
2. 计算离均差平方和 `sumSqX = Σ(x-meanX)^2`、`sumSqY = Σ(y-meanY)^2`
3. 计算离均差积和 `sumXY = Σ(x-meanX)(y-meanY)`
4. 计算协方差 `cov = sumXY/(n-1)` 与皮尔逊相关 `r = sumXY / sqrt(sumSqX * sumSqY)`

**边界条件**
- `n < 2` 时，方差/协方差无意义：应返回 0 或做保护（当前实现按计算过程自然得到 0 或 NaN，再由上层展示兜底）。
- `sumSqX` 或 `sumSqY` 过小（数据几乎常量）时，相关系数分母接近 0：需要保护避免除零（当前实现通过 sqrt 分母控制，但仍建议 UI 层对 NaN 做展示兜底）。

### 2.2 一元线性回归与 ANOVA 分解（OLS + SSE/SSR/SST）

**位置**：`regression.js: calculateRegression(points, statistics)`

**输入**
- `points`
- `statistics`（至少需要 `meanX, meanY, sumSqX, sumXY, r`）

**输出**
- `regression: { slope, intercept, r, r2, p, f, ssr, sse, sst, msr, mse }`

**核心步骤（伪代码）**
```text
b = sumXY / sumSqX
a = meanY - b*meanX
for each point:
  yhat = a + b*x
  sse += (y - yhat)^2
  sst += (y - meanY)^2
ssr = sst - sse
msr = ssr / 1
mse = sse / (n-2)
f   = msr / mse
r2  = r^2
p   = approxPValue(f, df=n-2)  // 用 t≈sqrt(f) + 正态近似
```

**边界条件**
- `sumSqX == 0`：全部 X 相同，斜率不可定义；需避免除零（当前实现可进一步加保护）。
- `n <= 2`：`mse` 分母为 0 或负数，F/p 不可定义；建议 UI 显示为 “-”。

### 2.3 目标相关系数 R 的数据变换（保持均值/标准差不变）

**位置**：`interaction.js: generateDataForTargetR(targetR)`

**业务目标**
- 在不改变 `x̄、ȳ、Sx、Sy、n` 的情况下，把样本相关系数调整为目标 `targetR`。

**输入**
- `targetR ∈ [-1,1]`
- 当前 `state.points` 与 `state.statistics`

**输出**
- 新的 `state.points`（X 不变，只重塑 Y）

**核心原理（几何/正交分解）**
在标准化空间：`xStd` 与 `yStd` 都具有均值 0、方差 1。

将 `yStd` 分解为：
- 与 `xStd` 同方向的分量：`r * xStd`
- 与 `xStd` 正交的分量（残差形状）：`e = yStd - r*xStd`

把残差形状归一为 `zStd` 后，按目标相关系数重组：
`yStdNew = targetR*xStd + sqrt(1-targetR^2)*zStd`

最后把 `yStdNew` 反标准化回原尺度：`y = yStdNew*Sy + ȳ`

```mermaid
flowchart TB
  A[points + statistics] --> B[标准化: xStd, yStd]
  B --> C[残差分量 e = yStd - r*xStd]
  C --> D{e是否可用?}
  D --可用--> E[zStd = e / sd(e)]
  D --几乎线性相关--> F[生成随机 z 并对 xStd 正交化]
  E --> G[合成 yStdNew]
  F --> G[合成 yStdNew]
  G --> H[反标准化: y = yStdNew*Sy + ȳ]
  H --> I[写回 state.points]
```

**边界条件处理**
- 当数据已接近完全线性相关（`sd(e)` 很小）时，无法从当前 `yStd` 提取稳定的正交分量：此时生成随机 `z`，并通过“去均值 + 去与 xStd 相关部分 + 标准化”构造 `zStd`，保证 `cov(xStd,zStd)=0`。
- `targetR` 接近 ±1 时：`sqrt(1-targetR^2)` 接近 0，新的 `yStdNew` 将几乎完全由 `xStd` 决定，这是预期行为。

### 2.4 Venn 图：重叠面积严格映射为 R²（数值二分逼近）

**位置**：`ui.js` 中 Venn 图更新逻辑

**业务目标**
- 让两个圆的重叠面积比例精确等于 `R²`，用于解释“可解释变异占比”。

**输入**
- `r2 = clamp(regression.r2, 0, 1)`

**输出**
- 两个圆的水平距离 `d`（像素/相对距离），用于设置 transform

**核心步骤**
1. 设定圆半径 `r`（固定像素）
2. 定义“给定圆心距 d 的重叠面积函数” `A(d)`
3. 二分搜索 `d`，使 `A(d) / (πr²) ≈ r2`，迭代固定次数获得稳定结果

**边界条件**
- `r2=0`：圆心距趋向 `2r`，无重叠
- `r2=1`：圆心距趋向 `0`，完全重叠
- 数值稳定性：对 `acos` 与 `sqrt` 的参数做 clamp，避免浮点误差导致 NaN

### 2.5 变异分解图：把 SSR/SSE 的“距离”具象化为辅助线

**位置**：`chart.js: updateDecompositionCharts(points, regression, statistics)`

**业务目标**
- 以三张图分别展示：总变异 `Y-Ȳ`、解释变异 `Ŷ-Ȳ`、未解释变异 `Y-Ŷ`。

**输入**
- `points`
- `regression: slope, intercept`
- `statistics: meanY`

**输出**
- 三个 ECharts 实例的 series 配置：散点、回归线、均值线、以及按点生成的 lines（垂直虚线）

**关键构造**
- `linesTotal`: `[(x,y) -> (x,meanY)]`
- `linesExplained`: `[(x,yHat) -> (x,meanY)]`
- `linesUnexplained`: `[(x,y) -> (x,yHat)]`

**边界条件**
- `points` 为空：不更新或清空 series
- `meanY` 为 NaN：均值线与标签不更新

### 2.6 主面板随机生成：画布空间生成 + 数据空间映射（避免纵向偏态）

**位置**：`app.js: generateRandomData(count)`

**业务目标**
- 生成的散点在视觉上更“均衡/横向/斜向”，避免 X 过度集中造成回归线视觉斜率夸张。
- 同时允许与当前目标 `R` 保持一致的“斜向趋势”（R ≠ 0 时）。

**输入**
- `count`
- 当前图表容器 `width/height`
- 当前缩放 `state.zoomLevel`
- 当前目标相关 `targetR`（来自 UI 的 r-input/r-slider）

**输出**
- `state.points`

**核心步骤**
1. 在标准化空间采样 `u,v ~ N(0,1)`，合成 `yStd = targetR*u + sqrt(1-targetR^2)*v`
2. 用画布像素尺度设定 “希望的云团宽高”（`sdXpx/sdYpx`），再换算到数据空间 `sdX/sdY`
3. 映射回数据坐标：`x = center + u*sdX`，`y = center + yStd*sdY`
4. 用有限次数重试把点约束在当前视窗范围内（留出 margin）

**边界条件**
- 容器宽高不可得时用 1 兜底，避免除零
- `targetR` 非法输入时 clamp
- 重试次数耗尽仍超界：接受最后一次结果（概率很低），以保证生成过程可终止

### 2.7 抽样模拟：R 次重复抽样与斜率分布可视化

**位置**：`sampling.js`

**输入（用户可调）**
- 总体参数：`μ1, σ1, μ2, σ2, β`
- 单次样本量：`n`
- 重复次数：`R`（单选或自定义，最大 10000）

**输出**
- `allSamplingData: Array<{id,a,b,t,f,r,meanY}>`
- 图表：斜率 b 直方图 + 拟合曲线
- 表格：最后 6 次抽样结果
- CSV 下载：全量数据

**关键步骤**
1. 由 β 推导非标准化回归系数 `b = β*(σ2/σ1)`，截距 `a = μ2 - b*μ1`
2. 噪声标准差：`noiseSigma = sqrt(1-β^2)*σ2`（确保理论上 Var(Y) 与 β 对应）
3. 对每次抽样：
   - 生成 n 个 `x~N(μ1,σ1)`，`y=a+b*x+ε`
   - 在样本层面做一次简化回归计算（a,b,r,t,f）
4. 汇总绘制直方图并生成拟合曲线（当前以正态近似）

**边界条件**
- `n<3` 时 t/F 不可靠：可提示或在 UI 中以 “-” 展示
- `β` 超出 [-1,1] 时 `sqrt(1-β^2)` 需 clamp（当前实现用 `Math.max(0, 1-β^2)`）

---

## 3. 程序功能介绍模块

本项目为本地静态前端页面，无登录、无账号体系、无服务端写入能力，因此**无权限控制规则**（所有功能对所有用户开放，数据仅存在于浏览器内存中）。

### 3.1 P0：主回归交互（核心教学能力）

**功能**
- 主散点图（数据点 + 回归线）
- 拖拽改点 / 添加点 / 删除点
- 目标相关系数 R 动态调整
- 缩放视图（并保持坐标轴 1:1）

**交互逻辑**
- 拖拽/增删操作只改 `state.points`，随后调用 `update()` 全量刷新。
- 调整目标 R 时调用“正交分解变换”重塑 Y，再进入 `update()`。

**依赖关系**
- `interaction.js` 负责事件绑定与触发
- `chart.js` 负责可视化与拖拽层
- `statistics.js + regression.js` 提供计算结果

### 3.2 P0：统计解释与结果呈现（概念对齐）

**功能**
- 右侧统计指标面板（均值、标准差、协方差、回归方程等）
- Venn 图（重叠面积 = R²）
- ANOVA 表（SSR/SSE/SST、自由度、均方、F、p）
- 左侧数据表（每个点的预测值与平方和分解）

**交互逻辑**
- 所有数值在 `update()` 后由 `ui.js/table.js` 写入 DOM。
- Venn 图根据 `regression.r2` 计算圆心距，并设置两个圆的位置（视觉解释模型解释力）。

**依赖关系**
- `ui.js` 依赖 `state.statistics/state.regression`
- `table.js` 依赖 `state.points/state.statistics/state.regression`

### 3.3 P1：变异分解图（SSR/SSE 的几何直观）

**功能**
- 三张分解图：总变异、解释变异、未解释变异
- 均值线（水平虚线）与按点的垂直辅助线

**交互逻辑**
- `chart.js` 在 `updateChart()` 内调用 `updateDecompositionCharts` 同步更新三张图。
- 均值标签采用 DOM 叠加层来渲染 KaTeX，并用像素坐标更新位置。

**依赖关系**
- 依赖回归参数与 `meanY`（来自 `regression/statistics`）

### 3.4 P1：随机生成（用于快速构造可讨论的数据集）

**功能**
- 通过按钮按数量生成散点
- 生成时考虑当前 `R` 与画布比例，使点云更均衡、可解释

**交互逻辑**
- 按钮触发 `generateRandomData(count)` 直接替换 `state.points`，随后 `update()`

**依赖关系**
- `app.js` 依赖 `utils.js:getStandardNormal` 与 DOM 的图表容器尺寸

### 3.5 P1：回归抽样模拟子系统（实验/演示扩展）

**功能**
- 可调总体参数与样本量 n
- 可选/自定义重复抽样次数 R（最高 10000）
- 输出斜率 b 的分布图（直方图 + 拟合曲线）
- 输出最近 6 次结果表，并支持下载全量 CSV
- 一键重置参数并关闭结果

**交互逻辑**
- 参数输入与滑块双向同步
- 点击“分析”执行 R 次模拟并渲染结果
- 点击“重置”恢复默认值并隐藏结果区域

**依赖关系**
- `sampling.js` 依赖 ECharts 与 `utils.js:roundNumber`
- 与主回归系统解耦，不读写 `state.points`

---

## 附：代码入口与文件地图（快速定位）

- 页面结构：`index.html`
- 入口与统一刷新：`js/app.js`
- 全局状态：`js/state.js`
- 描述性统计：`js/statistics.js`
- 回归与 ANOVA：`js/regression.js`
- 图表与分解图：`js/chart.js`
- UI/公式/Venn/ANOVA DOM：`js/ui.js`
- 数据表渲染：`js/table.js`
- 交互绑定与目标R变换：`js/interaction.js`
- 抽样模拟：`js/sampling.js`

