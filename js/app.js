/**
 * 程序入口模块
 * 负责组装各个模块，初始化数据，并定义全局唯一的刷新流程
 */

import { state } from './state.js';
import { getRandomFloat } from './utils.js';
import { calculateLinearRegression } from './regression.js';
import { calculatePearsonCorrelation, calculateRSquared } from './statistics.js';
import { initChart, updateChart } from './chart.js';
import { updateTable } from './table.js';
import { updateStatsUI } from './ui.js';
import { initInteractions } from './interaction.js';

/**
 * 生成初始随机数据
 */
function initData() {
    const pointCount = 25;
    state.points = [];
    
    for (let i = 0; i < pointCount; i++) {
        state.points.push({
            x: getRandomFloat(95, 105),
            y: getRandomFloat(90, 110)
        });
    }
}

/**
 * 统一的页面刷新机制
 * 每当数据发生变化（如拖拽、增删），都应调用此函数进行全局同步
 */
function update() {
    // 1. 重新计算所有统计量
    const regressionModel = calculateLinearRegression(state.points);
    const r = calculatePearsonCorrelation(state.points);
    const r2 = calculateRSquared(r);
    const n = state.points.length;

    // 2. 刷新中间图表
    updateChart(state.points, regressionModel);

    // 3. 刷新右侧统计量
    updateStatsUI(regressionModel, r, r2, n);

    // 4. 刷新左侧数据表
    updateTable(state.points);
}

/**
 * DOM 加载完成后的初始化流程
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化数据
    initData();

    // 2. 初始化 ECharts 实例
    const chartContainer = document.getElementById('main-chart');
    initChart(chartContainer);

    // 3. 绑定交互事件（传入全局 update 引用）
    initInteractions(update);

    // 4. 执行首次全局刷新
    update();
});
