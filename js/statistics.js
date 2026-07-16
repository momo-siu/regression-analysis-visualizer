/**
 * 统计量计算模块
 * 负责计算均值、方差、协方差、相关系数等描述性统计指标
 */

import { calculateMean } from './utils.js';

/**
 * 计算数据集的描述性统计量并返回
 * @param {Array<{x: number, y: number}>} points 
 * @returns {Object} 包含均值、方差、标准差、协方差和相关系数等
 */
export function calculateStatistics(points) {
    const n = points.length;
    if (n < 2) {
        return {
            meanX: 0, meanY: 0,
            varianceX: 0, varianceY: 0,
            sdX: 0, sdY: 0,
            covariance: 0,
            r: 0
        };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const meanX = calculateMean(xs);
    const meanY = calculateMean(ys);

    let sumSqX = 0;
    let sumSqY = 0;
    let sumXY = 0;

    for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
        sumXY += dx * dy;
    }

    // 样本方差 (n-1)
    const varianceX = sumSqX / (n - 1);
    const varianceY = sumSqY / (n - 1);
    
    const sdX = Math.sqrt(varianceX);
    const sdY = Math.sqrt(varianceY);
    
    // 样本协方差
    const covariance = sumXY / (n - 1);

    // 皮尔逊相关系数
    const r = (sumSqX === 0 || sumSqY === 0) ? 0 : sumXY / Math.sqrt(sumSqX * sumSqY);

    return {
        meanX,
        meanY,
        sumSqX,
        sumSqY,
        sumXY,
        varianceX,
        varianceY,
        sdX,
        sdY,
        covariance,
        r
    };
}
