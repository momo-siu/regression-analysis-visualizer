/**
 * 页面 UI 刷新模块
 * 负责更新右侧边栏统计量及 ANOVA 表格
 */

import { state } from './state.js';
import { roundNumber } from './utils.js';

/**
 * 刷新统计量指标及 ANOVA 表格显示
 */
export function updateStatsUI() {
    const { points, regression, statistics } = state;
    const n = points.length;

    // --- 1. 更新统计面板 (使用 KaTeX 渲染公式) ---
    const statPanel = document.getElementById('math-stats-container');
    if (statPanel && window.katex) {
        const sign = regression.intercept >= 0 ? '+' : '-';
        const absIntercept = Math.abs(roundNumber(regression.intercept, 3));
        
        // 构建多行居中的 LaTeX 公式，增加行间距 [1.5ex]
          const tex = `\\begin{gathered}
  n = ${n} \\\\[1.5ex]
  \\bar{x} = ${roundNumber(statistics.meanX, 2)} \\\\[1.5ex]
  \\bar{y} = ${roundNumber(statistics.meanY, 2)} \\\\[1.5ex]
  S_x = ${roundNumber(statistics.sdX, 2)} \\\\[1.5ex]
  S_y = ${roundNumber(statistics.sdY, 2)} \\\\[1.5ex]
  \\text{Cov}(x,y) = ${roundNumber(statistics.covariance, 3)} \\\\[1.5ex]
  R = ${roundNumber(statistics.r, 4)} \\\\[1.5ex]
  R^2 = ${roundNumber(regression.r2, 4)} \\\\[1.5ex]
  \\hat{y} = ${roundNumber(regression.slope, 3)}x ${sign} ${absIntercept}
  \\end{gathered}`;

        try {
            katex.render(tex, statPanel, {
                displayMode: true,
                throwOnError: false
            });
        } catch (e) {
            console.error("KaTeX rendering error:", e);
        }
    }

    // 同步顶部输入框和滑块（如果不处于聚焦状态）
    const rInput = document.getElementById('r-input');
    const rSlider = document.getElementById('r-slider');
    if (rInput && document.activeElement !== rInput) {
        rInput.value = roundNumber(statistics.r, 2);
    }
    if (rSlider && document.activeElement !== rSlider) {
        rSlider.value = roundNumber(statistics.r, 2);
    }

    // --- 2. 更新 ANOVA 表格 ---
    const dfr = 1;
    const dfe = n > 2 ? n - 2 : 0;
    const dft = n > 1 ? n - 1 : 0;

    const elSsr = document.getElementById('anova-ssr');
    const elMsr = document.getElementById('anova-msr');
    const elF = document.getElementById('anova-f');
    const elP = document.getElementById('anova-p');

    const elSse = document.getElementById('anova-sse');
    const elDfe = document.getElementById('anova-dfe');
    const elMse = document.getElementById('anova-mse');

    const elSst = document.getElementById('anova-sst');
    const elDft = document.getElementById('anova-dft');

    if (elSsr) elSsr.textContent = String(roundNumber(regression.ssr, 2));
    if (elMsr) elMsr.textContent = String(roundNumber(regression.msr, 2));
    if (elF) elF.textContent = String(roundNumber(regression.f, 2));
    if (elP) elP.textContent = regression.p < 0.001 ? '< 0.001' : String(roundNumber(regression.p, 4));

    if (elSse) elSse.textContent = String(roundNumber(regression.sse, 2));
    if (elDfe) elDfe.textContent = String(dfe);
    if (elMse) elMse.textContent = String(roundNumber(regression.mse, 2));

    if (elSst) elSst.textContent = String(roundNumber(regression.sst, 2));
    if (elDft) elDft.textContent = String(dft);
}
