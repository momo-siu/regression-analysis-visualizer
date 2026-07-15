/**
 * 页面 UI 刷新模块
 * 负责更新右侧边栏统计量等文本信息
 */

import { roundNumber } from './utils.js';

/**
 * 刷新统计量指标显示
 * @param {{slope: number, intercept: number}} regressionModel - 回归模型参数
 * @param {number} r - 皮尔逊相关系数
 * @param {number} r2 - 决定系数
 * @param {number} n - 样本量
 */
export function updateStatsUI(regressionModel, r, r2, n) {
    const { slope, intercept } = regressionModel;
    
    // 构造回归方程文本，处理截距的正负号
    const sign = intercept >= 0 ? '+' : '-';
    const absIntercept = Math.abs(roundNumber(intercept, 3));
    const equationStr = `y = ${roundNumber(slope, 3)}x ${sign} ${absIntercept}`;

    // 更新 DOM 节点
    const elEquation = document.getElementById('stat-equation');
    const elR = document.getElementById('stat-r');
    const elR2 = document.getElementById('stat-r2');
    const elN = document.getElementById('stat-n');

    if (elEquation) elEquation.textContent = equationStr;
    if (elR) elR.textContent = String(roundNumber(r, 4));
    if (elR2) elR2.textContent = String(roundNumber(r2, 4));
    if (elN) elN.textContent = String(n);
}
