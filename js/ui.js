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

        try {
            statPanel.textContent = '';

            const rows = [
                { label: '样本量：', tex: `n=${n}` },
                { label: '均值：', tex: `\\bar{x}=${roundNumber(statistics.meanX, 2)}` },
                { label: '均值：', tex: `\\bar{y}=${roundNumber(statistics.meanY, 2)}` },
                { label: '标准差：', tex: `S_x=${roundNumber(statistics.sdX, 2)}` },
                { label: '标准差：', tex: `S_y=${roundNumber(statistics.sdY, 2)}` },
                { label: '协方差：', tex: `\\text{Cov}(x,y)=${roundNumber(statistics.covariance, 3)}` },
                { label: '相关系数：', tex: `R=${roundNumber(statistics.r, 4)}` },
                { label: '决定系数：', tex: `R^2=${roundNumber(regression.r2, 4)}` },
                { label: '回归方程：', tex: `\\hat{y}=${roundNumber(regression.slope, 3)}x${sign}${absIntercept}` }
            ];

            const table = document.createElement('div');
            table.className = 'stats-lines';

            for (const row of rows) {
                const rowEl = document.createElement('div');
                rowEl.className = 'stats-row';

                const labelEl = document.createElement('div');
                labelEl.className = 'stats-label';
                labelEl.textContent = row.label;

                const formulaEl = document.createElement('div');
                formulaEl.className = 'stats-formula';
                katex.render(row.tex, formulaEl, { displayMode: false, throwOnError: false });

                rowEl.append(labelEl, formulaEl);
                table.append(rowEl);
            }

            statPanel.append(table);
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

    // --- 3. 更新统计量摘要表格 ---
    const elStatMeanX = document.getElementById('stat-mean-x');
    const elStatSSX = document.getElementById('stat-ss-x');
    const elStatVarX = document.getElementById('stat-var-x');
    const elStatSDX = document.getElementById('stat-sd-x');

    const elStatMeanY = document.getElementById('stat-mean-y');
    const elStatSSY = document.getElementById('stat-ss-y');
    const elStatVarY = document.getElementById('stat-var-y');
    const elStatSDY = document.getElementById('stat-sd-y');

    const elStatSP = document.getElementById('stat-sp');
    const elStatCov = document.getElementById('stat-cov');
    const elStatR = document.getElementById('stat-r');

    if (elStatMeanX) elStatMeanX.textContent = String(roundNumber(statistics.meanX, 3));
    if (elStatSSX) elStatSSX.textContent = String(roundNumber(statistics.sumSqX, 3));
    if (elStatVarX) elStatVarX.textContent = String(roundNumber(statistics.varianceX, 3));
    if (elStatSDX) elStatSDX.textContent = String(roundNumber(statistics.sdX, 3));

    if (elStatMeanY) elStatMeanY.textContent = String(roundNumber(statistics.meanY, 3));
    if (elStatSSY) elStatSSY.textContent = String(roundNumber(statistics.sumSqY, 3));
    if (elStatVarY) elStatVarY.textContent = String(roundNumber(statistics.varianceY, 3));
    if (elStatSDY) elStatSDY.textContent = String(roundNumber(statistics.sdY, 3));

    if (elStatSP) elStatSP.textContent = String(roundNumber(statistics.sumXY, 3));
    if (elStatCov) elStatCov.textContent = String(roundNumber(statistics.covariance, 3));
    if (elStatR) elStatR.textContent = String(roundNumber(statistics.r, 3));

    // --- 4. 渲染变异分解图标题 (如果尚未渲染) ---
    renderMathTitles();
}

/**
 * 渲染页面中带有 .math-render 类的 KaTeX 公式
 */
function renderMathTitles() {
    if (!window.katex) return;
    const elements = document.querySelectorAll('.math-render');
    elements.forEach(el => {
        const text = el.textContent;
        if (text.includes('$')) {
            const parts = text.split('$');
            el.textContent = parts[0]; // 保留中文前缀
            const span = document.createElement('span');
            katex.render(parts[1], span, { throwOnError: false });
            el.appendChild(span);
            el.classList.remove('math-render'); // 标记为已渲染
        }
    });
}
