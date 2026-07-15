/**
 * 数据表格渲染模块
 * 负责将状态中的点数据渲染到页面左侧的表格中
 */

import { state } from './state.js';
import { roundNumber } from './utils.js';

/**
 * 刷新数据表格内容
 */
export function updateTable() {
    const tbody = document.querySelector('#data-table tbody');
    if (!tbody) return;

    const { points, regression, statistics } = state;
    const { slope, intercept } = regression;
    const { meanY } = statistics;

    // 清空现有表格内容
    tbody.innerHTML = '';

    // 重新生成每一行
    points.forEach((point, index) => {
        const yHat = slope * point.x + intercept;
        const sst_i = Math.pow(point.y - meanY, 2);
        const ssr_i = Math.pow(yHat - meanY, 2);
        const sse_i = Math.pow(point.y - yHat, 2);

        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td');
        tdId.textContent = String(index + 1);
        
        const tdX = document.createElement('td');
        tdX.textContent = String(roundNumber(point.x, 2));
        
        const tdY = document.createElement('td');
        tdY.textContent = String(roundNumber(point.y, 2));

        const tdYHat = document.createElement('td');
        tdYHat.textContent = String(roundNumber(yHat, 2));

        const tdSst = document.createElement('td');
        tdSst.textContent = String(roundNumber(sst_i, 2));

        const tdSsr = document.createElement('td');
        tdSsr.textContent = String(roundNumber(ssr_i, 2));

        const tdSse = document.createElement('td');
        tdSse.textContent = String(roundNumber(sse_i, 2));

        tr.appendChild(tdId);
        tr.appendChild(tdX);
        tr.appendChild(tdY);
        tr.appendChild(tdYHat);
        tr.appendChild(tdSst);
        tr.appendChild(tdSsr);
        tr.appendChild(tdSse);
        
        tbody.appendChild(tr);
    });
}
