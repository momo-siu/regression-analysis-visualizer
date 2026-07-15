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

    // --- 1. 更新统计面板 ---
    const elN = document.getElementById('stat-n');
    const elMean = document.getElementById('stat-mean');
    const elSd = document.getElementById('stat-sd');
    const elCov = document.getElementById('stat-cov');
    const elR = document.getElementById('stat-r');
    const elR2 = document.getElementById('stat-r2');
    const elEquation = document.getElementById('stat-equation');

    if (elN) elN.textContent = String(n);
    if (elMean) elMean.textContent = `${roundNumber(statistics.meanX, 2)}, ${roundNumber(statistics.meanY, 2)}`;
    if (elSd) elSd.textContent = `${roundNumber(statistics.sdX, 2)}, ${roundNumber(statistics.sdY, 2)}`;
    if (elCov) elCov.textContent = String(roundNumber(statistics.covariance, 3));
    if (elR) elR.textContent = String(roundNumber(statistics.r, 4));
    if (elR2) elR2.textContent = String(roundNumber(regression.r2, 4));

    if (elEquation) {
        const sign = regression.intercept >= 0 ? '+' : '-';
        const absIntercept = Math.abs(roundNumber(regression.intercept, 3));
        elEquation.textContent = `y = ${roundNumber(regression.slope, 3)}x ${sign} ${absIntercept}`;
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
