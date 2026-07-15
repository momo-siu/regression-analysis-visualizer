/**
 * 工具函数模块
 * 提供通用的纯函数，包括随机数生成、数值处理等
 */

/**
 * 生成指定范围内的随机浮点数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 生成的随机数
 */
export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 保留指定位数的小数
 * @param {number} num - 待处理数值
 * @param {number} decimals - 保留的小数位数，默认 3 位
 * @returns {number} 处理后的数值
 */
export function roundNumber(num, decimals = 3) {
    if (typeof num !== 'number' || isNaN(num)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

/**
 * 计算数值数组的平均值
 * @param {number[]} arr - 数值数组
 * @returns {number} 平均值
 */
export function calculateMean(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

/**
 * 生成标准正态分布随机数 (Box-Muller 变换)
 * @returns {number}
 */
export function getStandardNormal() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // 避免为0
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * 计算学生 t 分布的近似 P 值 (双尾)
 * @param {number} t - t统计量
 * @param {number} df - 自由度
 * @returns {number} p值
 */
export function getPValueTTest(t, df) {
    if (df <= 0) return NaN;
    // 使用简单的正态近似，当 df 较大时准确，df 较小时有一定误差
    // 为了教学演示，这里使用一种简单的近似算法
    const x = df / (df + t * t);
    // 这里我们可以使用不完全 Beta 函数，但为保持代码简单，使用简单的经验近似：
    // 若 df 较小，误差较大，但足够作为可视化演示
    
    // 更好的近似：使用近似的 z 值
    const a = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + t * t / (2 * df));
    return 2 * (1 - normalCDF(Math.abs(a)));
}

/**
 * 标准正态分布 CDF 近似计算
 */
export function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423;
    const prob = d * Math.exp(-x * x / 2) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x > 0 ? 1 - prob : prob;
}
