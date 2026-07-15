/**
 * 统计量计算模块
 * 负责计算相关系数、决定系数等统计指标
 */

import { calculateMean } from './utils.js';

/**
 * 计算皮尔逊相关系数 (Pearson Correlation Coefficient, r)
 * @param {Array<{x: number, y: number}>} points - 数据点数组
 * @returns {number} 相关系数 r，范围 [-1, 1]
 */
export function calculatePearsonCorrelation(points) {
    if (!points || points.length < 2) return 0;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const meanX = calculateMean(xs);
    const meanY = calculateMean(ys);

    let sumXY = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < points.length; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        sumXY += dx * dy;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
    }

    if (sumSqX === 0 || sumSqY === 0) return 0;

    return sumXY / Math.sqrt(sumSqX * sumSqY);
}

/**
 * 计算决定系数 (R-squared)
 * 对于一元线性回归，决定系数等于皮尔逊相关系数的平方
 * @param {number} r - 皮尔逊相关系数
 * @returns {number} 决定系数 R²
 */
export function calculateRSquared(r) {
    return r * r;
}
