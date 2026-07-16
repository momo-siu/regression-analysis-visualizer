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

    const { meanX, meanY, sdX, sdY, r } = statistics;

    // 1. 提取并标准化当前的 X 和 Y
    const xStd = points.map(p => sdX > 0 ? (p.x - meanX) / sdX : 0);
    const yStdCurrent = points.map(p => sdY > 0 ? (p.y - meanY) / sdY : 0);

    // 2. 计算当前 Y 向量中与 X 正交的分量 (残差项)
    // 在标准化空间中：yStd = r * xStd + e
    let e = yStdCurrent.map((y, i) => y - r * xStd[i]);

    // 3. 计算正交分量的标准差
    // 理论上 Var(e) = 1 - r^2
    const currentVarE = 1 - r * r;
    const currentSdE = currentVarE > 1e-10 ? Math.sqrt(currentVarE) : 0;

    let zStd;
    if (currentSdE > 1e-4) {
        // 如果当前有足够的分量，则使用当前分量（保持数据“形状”）
        zStd = e.map(val => val / currentSdE);
    } else {
        // 如果当前数据已经完全线性相关，则无法提取正交分量，需生成随机正交分量
        let zs = points.map(() => getStandardNormal());
        const meanZ = calculateMean(zs);
        zs = zs.map(z => z - meanZ);
        
        let covXZ = 0;
        for (let i = 0; i < n; i++) {
            covXZ += xStd[i] * zs[i];
        }
        covXZ /= (n - 1);
        
        zs = zs.map((z, i) => z - covXZ * xStd[i]);
        
        let varZ = 0;
        for (let i = 0; i < n; i++) {
            varZ += zs[i] * zs[i];
        }
        varZ /= (n - 1);
        const sdZ = varZ > 0 ? Math.sqrt(varZ) : 1;
        zStd = zs.map(z => z / sdZ);
    }

    // 4. 合成新的标准化 Y
    // yStdNew = targetR * xStd + sqrt(1 - targetR^2) * zStd
    const coeff = Math.sqrt(1 - targetR * targetR);
    
    const newPoints = points.map((p, i) => {
        const yStdNew = targetR * xStd[i] + coeff * zStd[i];
        // 5. 还原到原始的均值和标准差
        return {
            x: p.x,
            y: yStdNew * sdY + meanY
        };
    });

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
