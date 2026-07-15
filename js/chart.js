/**
 * ECharts 图表渲染与封装模块
 * 负责图表实例的创建、配置、数据更新以及图形拖拽交互
 */

import { state } from './state.js';

let chartInstance = null;
let onUpdateCallback = null;

/**
 * 初始化 ECharts 实例
 * @param {HTMLElement} container - 图表挂载的 DOM 容器
 * @param {Function} updateCb - 数据更新回调
 */
export function initChart(container, updateCb) {
    if (!container) return;
    
    onUpdateCallback = updateCb;
    chartInstance = echarts.init(container);
    
    const option = {
        animation: false, // 拖拽时为了流畅关闭动画
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                if (params.seriesType === 'scatter') {
                    return `X: ${params.value[0].toFixed(2)}<br/>Y: ${params.value[1].toFixed(2)}`;
                }
                return params.seriesName;
            }
        },
        xAxis: {
            type: 'value',
            min: 80,
            max: 120,
            name: 'X',
            nameLocation: 'middle',
            nameGap: 30,
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
            type: 'value',
            min: 80,
            max: 120,
            name: 'Y',
            nameLocation: 'middle',
            nameGap: 40,
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [
            {
                name: '数据点',
                id: 'scatter-series',
                type: 'scatter',
                symbolSize: 10, // 稍微调大以便拖拽
                itemStyle: {
                    color: '#409eff',
                    opacity: 0.8
                },
                data: []
            },
            {
                name: '回归直线',
                type: 'line',
                showSymbol: false,
                itemStyle: { color: '#f56c6c' },
                lineStyle: { width: 2, type: 'solid' },
                data: []
            }
        ],
        graphic: []
    };

    chartInstance.setOption(option);

    window.addEventListener('resize', () => {
        chartInstance.resize();
        updateChartGraphics(); // 窗口调整时重新计算 graphic 位置
    });
}

/**
 * 更新图表数据和拖拽点
 */
export function updateChart() {
    if (!chartInstance) return;

    const { points, regression } = state;
    
    // 转换散点数据
    const scatterData = points.map(p => [p.x, p.y]);

    // 计算回归直线在坐标轴范围内的两端点
    const minX = 80;
    const maxX = 120;
    const { slope, intercept } = regression;
    
    const lineData = [
        [minX, slope * minX + intercept],
        [maxX, slope * maxX + intercept]
    ];

    // 更新基础数据
    chartInstance.setOption({
        series: [
            { data: scatterData },
            { data: lineData }
        ]
    });

    // 更新拖拽点
    updateChartGraphics();
}

/**
 * 内部函数：使用 graphic 生成可拖拽的点
 */
function updateChartGraphics() {
    const { points } = state;

    const graphicElements = points.map((p, index) => {
        const coord = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.x, p.y]);
        
        return {
            type: 'circle',
            id: `graphic-${index}`,
            position: coord,
            shape: { r: 6 },
            invisible: true, // 设置为透明，盖在真正的散点上
            draggable: true,
            ondrag: function (dx, dy) {
                onPointDragging(index, [this.x, this.y]);
            },
            z: 100 // 置于顶层
        };
    });

    chartInstance.setOption({
        graphic: graphicElements
    });
}

/**
 * 处理拖拽事件
 * @param {number} index - 拖拽点的索引
 * @param {Array<number>} pos - 当前像素坐标 [x, y]
 */
function onPointDragging(index, pos) {
    const dataCoord = chartInstance.convertFromPixel({ seriesIndex: 0 }, pos);
    
    // 更新 state 中的数据点
    state.points[index].x = dataCoord[0];
    state.points[index].y = dataCoord[1];
    
    // 触发全局更新
    if (onUpdateCallback) {
        onUpdateCallback();
    }
}
