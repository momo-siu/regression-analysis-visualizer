/**
 * ECharts 图表渲染与封装模块
 * 负责图表实例的创建、配置和数据更新
 */

let chartInstance = null;

/**
 * 初始化 ECharts 实例
 * @param {HTMLElement} container - 图表挂载的 DOM 容器
 */
export function initChart(container) {
    if (!container) return;
    
    // 初始化图表实例
    chartInstance = echarts.init(container);
    
    // 定义基础配置项
    const option = {
        animation: true,
        animationDuration: 500,
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
            splitLine: {
                lineStyle: { type: 'dashed' }
            }
        },
        yAxis: {
            type: 'value',
            min: 80,
            max: 120,
            name: 'Y',
            nameLocation: 'middle',
            nameGap: 40,
            splitLine: {
                lineStyle: { type: 'dashed' }
            }
        },
        series: [
            {
                name: '数据点',
                type: 'scatter',
                symbolSize: 8,
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
                itemStyle: {
                    color: '#f56c6c'
                },
                lineStyle: {
                    width: 2,
                    type: 'solid'
                },
                data: []
            }
        ]
    };

    chartInstance.setOption(option);

    // 监听窗口尺寸变化，实现响应式自适应
    window.addEventListener('resize', () => {
        chartInstance.resize();
    });
}

/**
 * 更新图表数据
 * @param {Array<{x: number, y: number}>} points - 当前的散点数据
 * @param {{slope: number, intercept: number}} regressionModel - 计算出的回归模型参数
 */
export function updateChart(points, regressionModel) {
    if (!chartInstance) return;

    // 转换散点数据格式
    const scatterData = points.map(p => [p.x, p.y]);

    // 计算回归直线在当前坐标轴范围内的两端点
    const minX = 80;
    const maxX = 120;
    const { slope, intercept } = regressionModel;
    
    const lineData = [
        [minX, slope * minX + intercept],
        [maxX, slope * maxX + intercept]
    ];

    // 更新 ECharts 配置项
    chartInstance.setOption({
        series: [
            {
                data: scatterData
            },
            {
                data: lineData
            }
        ]
    });
}
