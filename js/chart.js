/**
 * ECharts 图表渲染与封装模块
 * 负责图表实例的创建、配置、数据更新以及图形拖拽交互
 */

import { state } from './state.js';
import { confirmDeletePoint, addPointAt } from './interaction.js';

let chartInstance = null;
let chartTotal = null;
let chartExplained = null;
let chartUnexplained = null;
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
    
    const option = getBaseOption('X', 'Y');
    chartInstance.setOption(option);

    // 初始化分解图
    initDecompositionCharts();

    // 绑定全局点击事件，用于“添加点”模式
    chartInstance.getZr().on('click', (params) => {
        if (state.interactionMode === 'add') {
            const pointInPixel = [params.offsetX, params.offsetY];
            const pointInData = chartInstance.convertFromPixel({ seriesIndex: 0 }, pointInPixel);
            addPointAt(pointInData[0], pointInData[1], onUpdateCallback);
        }
    });

    window.addEventListener('resize', () => {
        chartInstance.resize();
        chartTotal?.resize();
        chartExplained?.resize();
        chartUnexplained?.resize();
        updateChartGraphics();
    });
}

/**
 * 获取基础配置
 */
function getBaseOption(xName, yName) {
    return {
        animation: false,
        grid: {
            left: 50,
            right: 50,
            top: 30,
            bottom: 50
        },
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
            name: xName,
            nameLocation: 'middle',
            nameGap: 30,
            splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
            axisLabel: {
                formatter: (value) => value.toFixed(0)
            }
        },
        yAxis: {
            type: 'value',
            min: 80,
            max: 120,
            name: yName,
            nameLocation: 'middle',
            nameRotate: 0,
            nameGap: 40,
            splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
            axisLabel: {
                formatter: (value) => value.toFixed(0)
            }
        },
        series: [
            {
                name: '数据点',
                id: 'scatter-series',
                type: 'scatter',
                symbolSize: 8,
                itemStyle: {
                    color: '#5b70ad',
                    opacity: 0.8
                },
                data: [],
                zIndex: 5
            },
            {
                name: '回归直线',
                type: 'line',
                showSymbol: false,
                itemStyle: { color: '#5b70ad' },
                lineStyle: { width: 2, type: 'solid' },
                data: [],
                zIndex: 4
            }
        ]
    };
}

/**
 * 初始化变异分解图
 */
function initDecompositionCharts() {
    const containerTotal = document.getElementById('chart-total');
    const containerExplained = document.getElementById('chart-explained');
    const containerUnexplained = document.getElementById('chart-unexplained');

    if (containerTotal) chartTotal = echarts.init(containerTotal);
    if (containerExplained) chartExplained = echarts.init(containerExplained);
    if (containerUnexplained) chartUnexplained = echarts.init(containerUnexplained);

    const baseOption = getBaseOption('', '');
    chartTotal?.setOption(baseOption);
    chartExplained?.setOption(baseOption);
    chartUnexplained?.setOption(baseOption);
}

/**
 * 更新所有图表
 */
export function updateChart() {
    if (!chartInstance) return;

    const { points, regression, zoomLevel, statistics } = state;
    
    // --- 1. 处理主图缩放 ---
    const baseRange = 40;
    const currentRange = baseRange * (100 / zoomLevel);
    const center = 100;
    const min = Number((center - currentRange / 2).toFixed(2));
    const max = Number((center + currentRange / 2).toFixed(2));

    const scatterData = points.map(p => [p.x, p.y]);
    const { slope, intercept } = regression;
    const lineData = [
        [min, slope * min + intercept],
        [max, slope * max + intercept]
    ];

    chartInstance.setOption({
        xAxis: { min, max },
        yAxis: { min, max },
        series: [
            { data: scatterData },
            { data: lineData }
        ]
    });

    // --- 2. 更新分解图 ---
    updateDecompositionCharts(points, regression, statistics);

    // --- 3. 更新拖拽/交互图形 ---
    updateChartGraphics();
}

/**
 * 更新变异分解图的具体逻辑
 */
function updateDecompositionCharts(points, regression, statistics) {
    if (!chartTotal || !chartExplained || !chartUnexplained) return;

    const { slope, intercept } = regression;
    const { meanY } = statistics;
    const scatterData = points.map(p => [p.x, p.y]);
    
    // 回归线数据 (范围固定 80~120)
    const lineData = [
        [80, slope * 80 + intercept],
        [120, slope * 120 + intercept]
    ];

    // 均值线配置 (MarkLine)
    const meanMarkLine = {
        symbol: ['none', 'none'],
        label: {
            show: false // 禁用 ECharts 自带标签，改用 DOM 叠加层实现 LaTeX 渲染
        },
        lineStyle: {
            type: 'dashed',
            color: '#999',
            width: 1
        },
        data: [{ yAxis: meanY }]
    };

    // 生成红虚线辅助线 (变异分解)
    // 1. 总变异: Y - Y_bar
    const linesTotal = points.map(p => ({
        coords: [[p.x, p.y], [p.x, meanY]]
    }));

    // 2. 解释变异: Y_hat - Y_bar
    const linesExplained = points.map(p => {
        const yHat = slope * p.x + intercept;
        return {
            coords: [[p.x, yHat], [p.x, meanY]]
        };
    });

    // 3. 未解释变异: Y - Y_hat
    const linesUnexplained = points.map(p => {
        const yHat = slope * p.x + intercept;
        return {
            coords: [[p.x, p.y], [p.x, yHat]]
        };
    });

    const commonSeries = [
        { data: scatterData },
        { data: lineData, markLine: meanMarkLine }
    ];

    const linesStyle = {
        type: 'lines',
        coordinateSystem: 'cartesian2d',
        lineStyle: {
            color: '#f56c6c',
            type: 'dashed',
            width: 1
        },
        zIndex: 3
    };

    chartTotal.setOption({
        series: [...commonSeries, { ...linesStyle, data: linesTotal }]
    });
    chartExplained.setOption({
        series: [...commonSeries, { ...linesStyle, data: linesExplained }]
    });
    chartUnexplained.setOption({
        series: [...commonSeries, { ...linesStyle, data: linesUnexplained }]
    });

    // --- 3. 更新 LaTeX 标签位置 ---
    updateMeanLabelPosition(chartTotal, meanY, 'label-total-mean');
    updateMeanLabelPosition(chartExplained, meanY, 'label-explained-mean');
    updateMeanLabelPosition(chartUnexplained, meanY, 'label-unexplained-mean');
}

/**
 * 更新 LaTeX 均值标签的像素位置
 */
function updateMeanLabelPosition(chart, meanY, labelId) {
    const el = document.getElementById(labelId);
    if (!el || !chart) return;
    
    // 获取均值在 Y 轴上的像素坐标
    const pixelPos = chart.convertToPixel({ yAxisIndex: 0 }, meanY);
    el.style.top = `${pixelPos}px`;
}

/**
 * 内部函数：根据当前模式更新 graphic 交互层
 */
function updateChartGraphics() {
    const { points, interactionMode } = state;

    const graphicElements = points.map((p, index) => {
        const coord = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.x, p.y]);
        
        // 基本属性
        const element = {
            type: 'circle',
            id: `graphic-${index}`,
            position: coord,
            shape: { r: 8 },
            invisible: false, 
            z: 100
        };

        if (interactionMode === 'drag') {
            // 拖拽模式：透明盖板，可拖拽
            element.invisible = true;
            element.draggable = true;
            element.cursor = 'move';
            element.ondrag = function () {
                onPointDragging(index, [this.x, this.y]);
            };
        } else if (interactionMode === 'delete') {
            // 删除模式：悬浮变红，点击删除
            element.invisible = true; // 默认也是透明的，但我们要监听事件
            element.cursor = 'pointer';
            
            // 鼠标移入：让对应的散点变红
            element.onmouseover = function() {
                highlightPoint(index, true);
            };
            // 鼠标移出：恢复颜色
            element.onmouseout = function() {
                highlightPoint(index, false);
            };
            // 点击：触发确认删除
            element.onclick = function() {
                confirmDeletePoint(index, onUpdateCallback);
            };
        } else {
            // 添加模式下，点的交互暂时关闭
            element.invisible = true;
            element.draggable = false;
            element.cursor = 'default';
        }

        return element;
    });

    chartInstance.setOption({
        graphic: graphicElements
    });
}

/**
 * 高亮显示某个点（删除模式下变红）
 * @param {number} index 
 * @param {boolean} isHighlight 
 */
function highlightPoint(index, isHighlight) {
    const { points } = state;
    const data = points.map((p, i) => {
        return {
            value: [p.x, p.y],
            itemStyle: {
                color: (i === index && isHighlight) ? '#f56c6c' : '#409eff',
                opacity: (i === index && isHighlight) ? 1 : 0.8
            }
        };
    });

    chartInstance.setOption({
        series: [{
            id: 'scatter-series',
            data: data
        }]
    });
}

/**
 * 处理拖拽事件
 */
function onPointDragging(index, pos) {
    const dataCoord = chartInstance.convertFromPixel({ seriesIndex: 0 }, pos);
    state.points[index].x = dataCoord[0];
    state.points[index].y = dataCoord[1];
    if (onUpdateCallback) onUpdateCallback();
}
