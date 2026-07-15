/**
 * 数据表格渲染模块
 * 负责将状态中的点数据渲染到页面左侧的表格中
 */

import { roundNumber } from './utils.js';

/**
 * 刷新数据表格内容
 * @param {Array<{x: number, y: number}>} points - 当前数据点数组
 */
export function updateTable(points) {
    const tbody = document.querySelector('#data-table tbody');
    if (!tbody) return;

    // 清空现有表格内容
    tbody.innerHTML = '';

    // 重新生成每一行
    points.forEach((point, index) => {
        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td');
        tdId.textContent = String(index + 1);
        
        const tdX = document.createElement('td');
        tdX.textContent = String(roundNumber(point.x, 2));
        
        const tdY = document.createElement('td');
        tdY.textContent = String(roundNumber(point.y, 2));

        tr.appendChild(tdId);
        tr.appendChild(tdX);
        tr.appendChild(tdY);
        
        tbody.appendChild(tr);
    });
}
