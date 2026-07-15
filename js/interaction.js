/**
 * 鼠标交互与事件绑定模块
 * 负责目标相关系数的数据生成、添加/删除点以及界面控制绑定
 */

import { state } from './state.js';
import { getStandardNormal, calculateMean } from './utils.js';

/**
 * 根据目标相关系数重新生成数据集
 * @param {number} targetR 
 */
function generateDataForTargetR(targetR) {
    const { points, statistics } = state;
    const n = points.length;
    if (n < 3) return;

    const { meanX, meanY, sdX, sdY } = statistics;

    // 提取所有 X 并标准化
    const xs = points.map(p => p.x);
    
    // 生成标准的 Y：Y_std = targetR * X_std + sqrt(1 - targetR^2) * Z
    // 其中 Z 是标准正态随机变量
    const coeff = Math.sqrt(1 - targetR * targetR);
    
    // 我们先计算 X_std
    const xStd = xs.map(x => sdX > 0 ? (x - meanX) / sdX : 0);

    const newPoints = [];
    for (let i = 0; i < n; i++) {
        const z = getStandardNormal();
        let yStd = targetR * xStd[i] + coeff * z;
        
        // 缩放回原始的 meanY 和 sdY
        let y = yStd * sdY + meanY;
        
        // 限制在图表范围内 (80~120 以外可能会被裁掉，这里做适度限制或不限制)
        // 避免极值破坏显示
        y = Math.max(60, Math.min(140, y));

        newPoints.push({
            x: xs[i],
            y: y
        });
    }

    state.points = newPoints;
}

/**
 * 初始化所有交互事件
 * @param {Function} updateCallback - 触发全局更新的回调函数
 */
export function initInteractions(updateCallback) {
    // 1. 模式切换绑定
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.interactionMode = btn.dataset.mode;
            
            // 切换模式后刷新图表以更新 graphic 状态
            updateCallback();
        });
    });

    // 2. 缩放控制绑定
    const zoomSlider = document.getElementById('zoom-slider');
    const zoomValueText = document.getElementById('zoom-value');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            state.zoomLevel = val;
            if (zoomValueText) zoomValueText.textContent = `${val}%`;
            updateCallback();
        });
    }

    // 3. 绑定目标相关系数滑块和输入框
    const rInput = document.getElementById('r-input');
    const rSlider = document.getElementById('r-slider');
    
    if (rInput && rSlider) {
        const handleRChange = (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) val = 0;
            val = Math.max(-1, Math.min(1, val));
            
            rInput.value = val;
            rSlider.value = val;

            generateDataForTargetR(val);
            updateCallback();
        };

        rSlider.addEventListener('input', handleRChange);
        rInput.addEventListener('change', handleRChange);
    }
}

/**
 * 处理点删除的逻辑
 * @param {number} index - 要删除的点的索引
 * @param {Function} updateCallback - 更新回调
 */
export function confirmDeletePoint(index, updateCallback) {
    const point = state.points[index];
    const confirmed = confirm(`是否删除点 (${point.x.toFixed(2)}, ${point.y.toFixed(2)})？`);
    if (confirmed) {
        state.points.splice(index, 1);
        updateCallback();
    }
}

/**
 * 处理在画布上点击添加点的逻辑
 * @param {number} x - 坐标系中的 X
 * @param {number} y - 坐标系中的 Y
 * @param {Function} updateCallback - 更新回调
 */
export function addPointAt(x, y, updateCallback) {
    state.points.push({ x, y });
    updateCallback();
}
