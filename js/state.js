/**
 * 全局状态管理模块
 * 集中管理应用数据，避免在各个模块间传递导致的混乱
 */

export const state = {
    /**
     * 散点数据数组
     * 格式：[{x: 98.2, y: 101.4}, ...]
     * @type {Array<{x: number, y: number}>}
     */
    points: [],

    /**
     * 当前交互模式
     * 'drag' - 拖拽移动
     * 'add' - 点击添加
     * 'delete' - 点击删除
     */
    interactionMode: 'drag',

    /**
     * 图表缩放比例 (100 表示 100%)
     */
    zoomLevel: 100,

    /**
     * 回归分析相关的统计结果
     */
    regression: {
        slope: 0,
        intercept: 0,
        r: 0,
        r2: 0,
        p: 0,
        f: 0,
        ssr: 0,
        sse: 0,
        sst: 0,
        msr: 0,
        mse: 0
    },

    /**
     * 描述性统计量
     */
    statistics: {
        meanX: 0,
        meanY: 0,
        sumSqX: 0,
        sumSqY: 0,
        sumXY: 0,
        varianceX: 0,
        varianceY: 0,
        covariance: 0,
        sdX: 0,
        sdY: 0,
        r: 0
    }
};
