/**
 * 回归分析算法模块
 * 负责计算一元线性回归的各项参数及 ANOVA 统计量
 */

import { calculateMean, getPValueTTest } from './utils.js';

/**
 * 计算一元线性回归及其所有相关统计量
 * @param {Array<{x: number, y: number}>} points 
 * @param {Object} stats - 已计算的描述性统计量
 * @returns {Object} 回归模型结果
 */
export function calculateRegression(points, stats) {
    const n = points.length;
    if (n < 3) { // 至少3个点才能计算回归和残差(df=n-2)
        return { slope: 0, intercept: 0, r2: 0, sst: 0, ssr: 0, sse: 0, msr: 0, mse: 0, f: 0, p: 1 };
    }

    const { meanX, meanY, r } = stats;

    let sumSqX = 0;
    let sumXY = 0;

    for (let i = 0; i < n; i++) {
        const dx = points[i].x - meanX;
        const dy = points[i].y - meanY;
        sumSqX += dx * dx;
        sumXY += dx * dy;
    }

    const slope = sumSqX === 0 ? 0 : sumXY / sumSqX;
    const intercept = meanY - slope * meanX;

    // 计算 SS
    let sse = 0;
    let sst = 0;

    for (let i = 0; i < n; i++) {
        const y = points[i].y;
        const yHat = slope * points[i].x + intercept;
        
        sse += Math.pow(y - yHat, 2);
        sst += Math.pow(y - meanY, 2);
    }

    const ssr = sst - sse;
    
    const df_r = 1;
    const df_e = n - 2;

    const msr = ssr / df_r;
    const mse = sse / df_e;

    const f = mse === 0 ? 0 : msr / mse;
    
    // 一元线性回归中 F = t^2
    const t = Math.sqrt(f);
    const p = mse === 0 ? 0 : getPValueTTest(t, df_e);

    const r2 = r * r;

    return {
        slope,
        intercept,
        r2,
        ssr,
        sse,
        sst,
        msr,
        mse,
        f,
        p
    };
}
