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
    // 1. 绑定添加数据点
    const btnAdd = document.getElementById('btn-add-point');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const { meanX, meanY } = state.statistics;
            state.points.push({
                x: meanX || 100,
                y: meanY || 100
            });
            updateCallback();
        });
    }

    // 2. 绑定删除数据点
    const btnDelete = document.getElementById('btn-delete-point');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if (state.points.length > 3) {
                state.points.pop(); // 删除最后一个点
                updateCallback();
            } else {
                alert('至少保留3个数据点！');
            }
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
            
            // 同步另一个控件
            rInput.value = val;
            rSlider.value = val;

            // 重新生成数据并更新
            generateDataForTargetR(val);
            updateCallback();
        };

        // 监听滑块拖动
        rSlider.addEventListener('input', handleRChange);
        // 监听输入框修改
        rInput.addEventListener('change', handleRChange);
    }
}
