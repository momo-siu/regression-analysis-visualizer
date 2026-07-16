/**
 * 程序入口模块
 * 负责组装各个模块，初始化数据，并定义全局唯一的刷新流程
 */

import { state } from './state.js';
import { getRandomFloat } from './utils.js';
import { calculateStatistics } from './statistics.js';
import { calculateRegression } from './regression.js';
import { initChart, updateChart } from './chart.js';
import { updateTable } from './table.js';
import { updateStatsUI } from './ui.js';
import { initInteractions } from './interaction.js';
import { initSampling } from './sampling.js';

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
 * 统一的页面刷新机制 (Data Driven)
 * 任何交互只修改 state.points，然后调用此方法
 */
function update() {
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
    initData();

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
