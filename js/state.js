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
    points: []
};
