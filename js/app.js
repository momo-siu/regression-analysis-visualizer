/**
 * 程序入口模块
 * 负责组装各个模块，初始化数据，并定义全局唯一的刷新流程
 */

import { state } from './state.js';
import { getStandardNormal } from './utils.js';
import { calculateStatistics } from './statistics.js';
import { calculateRegression } from './regression.js';
import { initChart, updateChart } from './chart.js';
import { updateTable } from './table.js';
import { updateStatsUI } from './ui.js';
import { initInteractions } from './interaction.js';
import { initSampling } from './sampling.js';

/**
 * 生成初始随机数据
 * @param {number} count - 生成点的数量
 */
export function generateRandomData(count = 25) {
    state.points = [];

    const chartEl = document.getElementById('main-chart');
    const width = Math.max(1, chartEl?.clientWidth ?? 1);
    const height = Math.max(1, chartEl?.clientHeight ?? 1);

    const zoomLevel = state.zoomLevel || 100;
    const baseRange = 40;
    const currentRange = baseRange * (100 / zoomLevel);
    const center = 100;
    const min = center - currentRange / 2;
    const max = center + currentRange / 2;
    const margin = currentRange * 0.08;

    const rInput = document.getElementById('r-input');
    const rSlider = document.getElementById('r-slider');
    let targetR = parseFloat(rInput?.value ?? rSlider?.value ?? '0');
    if (isNaN(targetR)) targetR = 0;
    targetR = Math.max(-1, Math.min(1, targetR));

    const coeff = Math.sqrt(Math.max(0, 1 - targetR * targetR));
    const baseSdPx = 0.2 * Math.min(width, height);
    const sdXpx = baseSdPx * 1.25;
    const sdYpx = baseSdPx * 0.45;
    const sdX = sdXpx / (width / currentRange);
    const sdY = sdYpx / (height / currentRange);

    for (let i = 0; i < count; i++) {
        let x = center;
        let y = center;
        let attempts = 0;

        while (attempts < 30) {
            const u = getStandardNormal();
            const v = getStandardNormal();
            const xStd = u;
            const yStd = targetR * u + coeff * v;

            x = center + xStd * sdX;
            y = center + yStd * sdY;

            if (
                x >= min + margin &&
                x <= max - margin &&
                y >= min + margin &&
                y <= max - margin
            ) {
                break;
            }

            attempts++;
        }

        state.points.push({ x, y });
    }
}

/**
 * 统一的页面刷新机制 (Data Driven)
 * 任何交互只修改 state.points，然后调用此方法
 */
export function update() {
    // 1. 计算描述性统计量
    state.statistics = calculateStatistics(state.points);

    // 2. 计算回归及 ANOVA 统计量
    state.regression = calculateRegression(state.points, state.statistics);

    // 3. 刷新中间图表（散点与回归线）
    updateChart();

    // 4. 刷新右侧与底部的统计量面板
    updateStatsUI();

    // 5. 刷新左侧数据表
    updateTable();
}

/**
 * DOM 加载完成后的初始化流程
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化数据
    generateRandomData(25);

    // 2. 初始化 ECharts 实例，传入 update 作为拖拽回调
    const chartContainer = document.getElementById('main-chart');
    initChart(chartContainer, update);

    // 3. 绑定交互事件（传入全局 update 引用）
    initInteractions(update);

    // 4. 初始化抽样模拟模块
    initSampling();

    // 5. 执行首次全局刷新
    update();
});
