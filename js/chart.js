/**
 * ECharts 图表渲染与封装模块
 * 负责图表实例的创建、配置、数据更新以及图形拖拽交互
 */

import { state } from './state.js';
import { confirmDeletePoint, addPointAt } from './interaction.js';

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
        animation: false,
        grid: {
            left: 50,
            right: 50,
            top: 50,
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
            name: 'X',
            nameLocation: 'middle',
            nameGap: 30,
            splitLine: { lineStyle: { type: 'dashed' } },
            axisLabel: {
                formatter: (value) => value.toFixed(1)
            }
        },
        yAxis: {
            type: 'value',
            min: 80,
            max: 120,
            name: 'Y',
            nameLocation: 'middle',
            nameRotate: 90,
            nameGap: 40,
            splitLine: { lineStyle: { type: 'dashed' } },
            axisLabel: {
                formatter: (value) => value.toFixed(1)
            }
        },
        series: [
            {
                name: '数据点',
                id: 'scatter-series',
                type: 'scatter',
                symbolSize: 10,
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
        updateChartGraphics();
    });
}

/**
 * 更新图表数据和拖拽点
 */
export function updateChart() {
    if (!chartInstance) return;

    const { points, regression, zoomLevel } = state;
    
    // --- 1. 处理缩放 ---
    // 基础范围 80~120 (范围为 40)
    // 缩放比例为 100% 时范围为 40，缩放为 200% 时范围为 20，缩放为 50% 时范围为 80
    const baseRange = 40;
    const currentRange = baseRange * (100 / zoomLevel);
    const center = 100;
    const min = Number((center - currentRange / 2).toFixed(2));
    const max = Number((center + currentRange / 2).toFixed(2));

    // 转换散点数据
    const scatterData = points.map(p => [p.x, p.y]);

    const { slope, intercept } = regression;
    const lineData = [
        [min, slope * min + intercept],
        [max, slope * max + intercept]
    ];

    // 更新图表配置
    chartInstance.setOption({
        xAxis: { min, max },
        yAxis: { min, max },
        series: [
            { data: scatterData },
            { data: lineData }
        ]
    });

    // --- 2. 更新拖拽/交互图形 ---
    updateChartGraphics();
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
