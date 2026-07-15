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
