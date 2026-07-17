/**
 * 页面 UI 刷新模块
 * 负责更新右侧边栏统计量及 ANOVA 表格
 */

import { state } from './state.js';
import { roundNumber } from './utils.js';

/**
 * 刷新统计量指标及 ANOVA 表格显示
 */
export function updateStatsUI() {
    const { points, regression, statistics } = state;
    const n = points.length;

    // --- 1. 更新统计面板 (使用 KaTeX 渲染公式) ---
    const statPanel = document.getElementById('math-stats-container');
    if (statPanel && window.katex) {
        const sign = regression.intercept >= 0 ? '+' : '-';
        const absIntercept = Math.abs(roundNumber(regression.intercept, 3));

        try {
            statPanel.textContent = '';

            // 1. 定义指标行，包含顶部和底部的 R/R^2
            const rows = [
                { label: '相关系数：', tex: `R=${roundNumber(statistics.r, 4)}` },
                { label: '决定系数：', tex: `R^2=${roundNumber(regression.r2, 4)}` },
                { label: '样本量：', tex: `n=${n}` },
                { label: '均值：', tex: `\\bar{X}=${roundNumber(statistics.meanX, 2)}` },
                { label: '均值：', tex: `\\bar{Y}=${roundNumber(statistics.meanY, 2)}` },
                { label: '标准差：', tex: `S_X=${roundNumber(statistics.sdX, 2)}` },
                { label: '标准差：', tex: `S_Y=${roundNumber(statistics.sdY, 2)}` },
                { label: '协方差：', tex: `\\text{Cov}(X,Y)=${roundNumber(statistics.covariance, 3)}` },
                { label: '相关系数：', tex: `R=${roundNumber(statistics.r, 4)}` },
                { label: '决定系数：', tex: `R^2=${roundNumber(regression.r2, 4)}` },
                { label: '回归方程：', tex: `\\hat{Y}=${roundNumber(regression.slope, 3)}X${sign}${absIntercept}` }
            ];

            const table = document.createElement('div');
            table.className = 'stats-lines';

            // 2. 渲染前两行 (R 和 R^2)
            for (let i = 0; i < 2; i++) {
                renderRow(table, rows[i]);
            }

            // 3. 插入 Venn 图容器
            const vennContainer = document.createElement('div');
            vennContainer.className = 'venn-diagram-container';
            vennContainer.innerHTML = `
                <div class="venn-circle venn-red"></div>
                <div class="venn-circle venn-blue"></div>
            `;
            table.appendChild(vennContainer);
            updateVennDiagram(vennContainer, regression.r2);

            // 4. 渲染剩余行
            for (let i = 2; i < rows.length; i++) {
                renderRow(table, rows[i]);
            }

            statPanel.append(table);
        } catch (e) {
            console.error("KaTeX rendering error:", e);
        }
    }

    // 同步顶部输入框和滑块（如果不处于聚焦状态）
    const rInput = document.getElementById('r-input');
    const rSlider = document.getElementById('r-slider');
    if (rInput && document.activeElement !== rInput) {
        rInput.value = roundNumber(statistics.r, 2);
    }
    if (rSlider && document.activeElement !== rSlider) {
        rSlider.value = roundNumber(statistics.r, 2);
    }

    // --- 2. 更新 ANOVA 表格 ---
    const dfr = 1;
    const dfe = n > 2 ? n - 2 : 0;
    const dft = n > 1 ? n - 1 : 0;

    const elSsr = document.getElementById('anova-ssr');
    const elMsr = document.getElementById('anova-msr');
    const elF = document.getElementById('anova-f');
    const elP = document.getElementById('anova-p');

    const elSse = document.getElementById('anova-sse');
    const elDfe = document.getElementById('anova-dfe');
    const elMse = document.getElementById('anova-mse');

    const elSst = document.getElementById('anova-sst');
    const elDft = document.getElementById('anova-dft');

    if (elSsr) elSsr.textContent = String(roundNumber(regression.ssr, 2));
    if (elMsr) elMsr.textContent = String(roundNumber(regression.msr, 2));
    if (elF) elF.textContent = String(roundNumber(regression.f, 2));
    if (elP) elP.textContent = regression.p < 0.001 ? '< 0.001' : String(roundNumber(regression.p, 4));

    if (elSse) elSse.textContent = String(roundNumber(regression.sse, 2));
    if (elDfe) elDfe.textContent = String(dfe);
    if (elMse) elMse.textContent = String(roundNumber(regression.mse, 2));

    if (elSst) elSst.textContent = String(roundNumber(regression.sst, 2));
    if (elDft) elDft.textContent = String(dft);

    // --- 3. 更新统计量摘要表格 ---
    const elStatMeanX = document.getElementById('stat-mean-x');
    const elStatSSX = document.getElementById('stat-ss-x');
    const elStatVarX = document.getElementById('stat-var-x');
    const elStatSDX = document.getElementById('stat-sd-x');

    const elStatMeanY = document.getElementById('stat-mean-y');
    const elStatSSY = document.getElementById('stat-ss-y');
    const elStatVarY = document.getElementById('stat-var-y');
    const elStatSDY = document.getElementById('stat-sd-y');

    const elStatSP = document.getElementById('stat-sp');
    const elStatCov = document.getElementById('stat-cov');
    const elStatR = document.getElementById('stat-r');

    if (elStatMeanX) elStatMeanX.textContent = String(roundNumber(statistics.meanX, 3));
    if (elStatSSX) elStatSSX.textContent = String(roundNumber(statistics.sumSqX, 3));
    if (elStatVarX) elStatVarX.textContent = String(roundNumber(statistics.varianceX, 3));
    if (elStatSDX) elStatSDX.textContent = String(roundNumber(statistics.sdX, 3));

    if (elStatMeanY) elStatMeanY.textContent = String(roundNumber(statistics.meanY, 3));
    if (elStatSSY) elStatSSY.textContent = String(roundNumber(statistics.sumSqY, 3));
    if (elStatVarY) elStatVarY.textContent = String(roundNumber(statistics.varianceY, 3));
    if (elStatSDY) elStatSDY.textContent = String(roundNumber(statistics.sdY, 3));

    if (elStatSP) elStatSP.textContent = String(roundNumber(statistics.sumXY, 3));
    if (elStatCov) elStatCov.textContent = String(roundNumber(statistics.covariance, 3));
    if (elStatR) elStatR.textContent = String(roundNumber(statistics.r, 3));

    // --- 4. 渲染变异分解图标题 (如果尚未渲染) ---
    renderMathTitles();
}

/**
 * 渲染单行统计指标
 */
function renderRow(container, row) {
    const rowEl = document.createElement('div');
    rowEl.className = 'stats-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'stats-label';
    labelEl.textContent = row.label;

    const formulaEl = document.createElement('div');
    formulaEl.className = 'stats-formula';
    katex.render(row.tex, formulaEl, { displayMode: false, throwOnError: false });

    rowEl.append(labelEl, formulaEl);
    container.append(rowEl);
}

/**
 * 更新 Venn 图中两个圆的重叠程度
 * 重叠面积 A = R^2，假设圆面积为 1 (半径 r = sqrt(1/pi))
 * 使用数值逼近方法计算圆心距 d
 */
function updateVennDiagram(container, r2) {
    const redCircle = container.querySelector('.venn-red');
    const blueCircle = container.querySelector('.venn-blue');
    
    // r = sqrt(1/pi) ≈ 0.564189
    const r = 0.564189;
    const targetArea = Math.max(0.0001, Math.min(0.9999, r2));
    
    // 二分法寻找距离 d，使得重叠面积等于 targetArea
    // 重叠面积公式: A = 2r^2 * acos(d/2r) - (d/2) * sqrt(4r^2 - d^2)
    let low = 0;
    let high = 2 * r;
    let d = high;
    
    for (let i = 0; i < 20; i++) {
        d = (low + high) / 2;
        const area = 2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d);
        if (area > targetArea) {
            low = d;
        } else {
            high = d;
        }
    }

    // 将 d 映射到像素或百分比偏移
    // 假设圆直径为 120px
    const baseSize = 120; 
    const distancePx = (d / (2 * r)) * baseSize;
   // 居中显示并应用偏移
    const offset = distancePx / 2;
    redCircle.style.transform = `translate(-50%, -50%) translateX(${-offset}px)`;
    blueCircle.style.transform = `translate(-50%, -50%) translateX(${offset}px)`;
}

/**
 * 渲染页面中带有 .math-render 类的 KaTeX 公式
 * 支持格式： "文本 $公式$ 文本" 或 "$公式$"
 */
function renderMathTitles() {
    if (!window.katex) return;
    const elements = document.querySelectorAll('.math-render');
    elements.forEach(el => {
        const text = el.textContent;
        if (text.includes('$')) {
            // 使用正则匹配所有 $...$ 部分
            const parts = text.split(/(\$.*?\$)/);
            el.textContent = ''; // 清空原始文本
            
            parts.forEach(part => {
                if (part.startsWith('$') && part.endsWith('$')) {
                    // 渲染 LaTeX 部分
                    const formula = part.slice(1, -1);
                    const span = document.createElement('span');
                    katex.render(formula, span, { throwOnError: false });
                    el.appendChild(span);
                } else {
                    // 保留普通文本部分
                    const textSpan = document.createTextNode(part);
                    el.appendChild(textSpan);
                }
            });
            el.classList.remove('math-render'); // 标记为已渲染
        }
    });
}
