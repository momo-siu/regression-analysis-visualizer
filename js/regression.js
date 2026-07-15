/**
 * 回归分析算法模块
 * 负责计算一元线性回归的各项参数
 */

import { calculateMean } from './utils.js';

/**
 * 计算一元线性回归参数 (普通最小二乘法 OLS)
 * 拟合方程：y = b1 * x + b0
 * @param {Array<{x: number, y: number}>} points - 数据点数组
 * @returns {{slope: number, intercept: number}} 回归直线的斜率 (b1) 和截距 (b0)
 */
export function calculateLinearRegression(points) {
    if (!points || points.length < 2) {
        return { slope: 0, intercept: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const meanX = calculateMean(xs);
    const meanY = calculateMean(ys);

    let numerator = 0;   // 分子：Σ(x_i - x_mean) * (y_i - y_mean)
    let denominator = 0; // 分母：Σ(x_i - x_mean)^2

    for (let i = 0; i < points.length; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        numerator += dx * dy;
        denominator += dx * dx;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
}
