/**
 * 鼠标交互与事件绑定模块
 * 第一版主要预留接口，后续用于实现点拖拽、添加、删除等交互
 */

/**
 * 初始化所有交互事件
 * @param {Function} updateCallback - 触发全局更新的回调函数
 */
export function initInteractions(updateCallback) {
    // 提示交互模块已加载
    console.log('Interactions module initialized. Awaiting future implementation.');

    // 预留位置：
    // 未来可在这里绑定 ECharts 的 graphic 组件实现数据点拖拽，
    // 或绑定鼠标点击事件实现增加、删除点。
    // 在状态改变后，调用 updateCallback() 刷新全局 UI。
}
