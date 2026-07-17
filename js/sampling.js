/**
 * 回归抽样模拟模块
 * 实现基于正态分布的随机抽样、一元线性回归循环计算及结果可视化
 */

import { roundNumber } from './utils.js';

let samplingChart = null;
let allSamplingData = []; // 存储所有 R 次抽样的回归结果
let isHistVisible = true;
let isTVisible = true;

/**
 * 初始化抽样模块
 */
export function initSampling() {
    setupEventListeners();
    updateUnstdBeta();
}

/**
 * 绑定事件监听
 */
function setupEventListeners() {
    // 1. 参数同步逻辑 (Input <-> Slider)
    const paramPairs = [
        ['mu1-input', 'mu1-slider'],
        ['sigma1-input', 'sigma1-slider'],
        ['mu2-input', 'mu2-slider'],
        ['sigma2-input', 'sigma2-slider'],
        ['beta-input', 'beta-slider'],
        ['n-input', 'n-slider']
    ];

    paramPairs.forEach(([inputId, sliderId]) => {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);

        input.addEventListener('input', () => {
            slider.value = input.value;
            updateUnstdBeta();
        });
        slider.addEventListener('input', () => {
            input.value = slider.value;
            updateUnstdBeta();
        });
    });

    // 2. 抽样次数 R 逻辑
    const rRadios = document.getElementsByName('r-choice');
    const rCustomInput = document.getElementById('r-custom-input');

    rRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) rCustomInput.value = '';
        });
    });

    rCustomInput.addEventListener('input', () => {
        if (rCustomInput.value !== '') {
            rRadios.forEach(r => r.checked = false);
        }
    });

    // 3. 分析按钮
    document.getElementById('analyze-btn').addEventListener('click', runSamplingAnalysis);

    // 6. 重置按钮
    document.getElementById('reset-sampling-btn').addEventListener('click', resetSampling);

    // 4. 图例切换 (使用复选框)
    document.querySelectorAll('.legend-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const item = checkbox.closest('.legend-item');
            const type = item.dataset.type;
            const isChecked = checkbox.checked;

            if (type === 'hist') {
                isHistVisible = isChecked;
            } else {
                isTVisible = isChecked;
            }
            
            item.classList.toggle('active', isChecked);
            updateSamplingChart();
        });
    });

    // 5. 下载按钮
    document.getElementById('download-btn').addEventListener('click', downloadData);
}

/**
 * 重置所有抽样参数并隐藏结果
 */
function resetSampling() {
    // 1. 恢复输入框和滑块默认值
    const defaults = {
        'mu1-input': '20.0', 'mu1-slider': '20.0',
        'sigma1-input': '4.0', 'sigma1-slider': '4.0',
        'mu2-input': '20.0', 'mu2-slider': '20.0',
        'sigma2-input': '8.0', 'sigma2-slider': '8.0',
        'beta-input': '0.000', 'beta-slider': '0.000',
        'n-input': '15', 'n-slider': '15'
    };

    for (const [id, val] of Object.entries(defaults)) {
        document.getElementById(id).value = val;
    }

    // 2. 恢复 R 抽样次数单选按钮 (默认 10000)
    const rRadios = document.getElementsByName('r-choice');
    rRadios.forEach(radio => {
        radio.checked = radio.value === '10000';
    });
    document.getElementById('r-custom-input').value = '';

    // 3. 更新非标准化系数显示
    updateUnstdBeta();

    // 4. 隐藏分析结果区域并清理数据
    document.getElementById('sampling-results').classList.add('hidden');
    allSamplingData = [];
    
    // 5. 如果有图表，销毁或清空（这里选择隐藏结果区已足够，但清空数据更彻底）
    if (samplingChart) {
        samplingChart.clear();
    }
}

/**
 * 更新非标准化系数展示
 */
function updateUnstdBeta() {
    const beta = parseFloat(document.getElementById('beta-input').value);
    const s1 = parseFloat(document.getElementById('sigma1-input').value);
    const s2 = parseFloat(document.getElementById('sigma2-input').value);
    const unstdBeta = beta * (s2 / s1);
    document.getElementById('unstd-beta-val').textContent = unstdBeta.toFixed(3);
}

/**
 * 运行抽样分析核心逻辑
 */
function runSamplingAnalysis() {
    // 获取参数
    const mu1 = parseFloat(document.getElementById('mu1-input').value);
    const s1 = parseFloat(document.getElementById('sigma1-input').value);
    const mu2 = parseFloat(document.getElementById('mu2-input').value);
    const s2 = parseFloat(document.getElementById('sigma2-input').value);
    const beta = parseFloat(document.getElementById('beta-input').value);
    const n = parseInt(document.getElementById('n-input').value);
    
    let R = 10000;
    const rCustom = document.getElementById('r-custom-input').value;
    if (rCustom) {
        R = parseInt(rCustom);
    } else {
        const checkedRadio = document.querySelector('input[name="r-choice"]:checked');
        if (checkedRadio) R = parseInt(checkedRadio.value);
    }

    const unstdBeta = beta * (s2 / s1);
    const intercept = mu2 - unstdBeta * mu1;
    // 噪声标准差：基于标准化系数计算 (1-beta^2)^0.5 * s2
    const noiseSigma = Math.sqrt(Math.max(0, 1 - beta * beta)) * s2;

    allSamplingData = [];
    
    // 开始 R 次循环抽样
    for (let i = 1; i <= R; i++) {
        const points = [];
        for (let j = 0; j < n; j++) {
            const x = generateNormal(mu1, s1);
            // Y = a + b*X + epsilon
            const y = intercept + unstdBeta * x + generateNormal(0, noiseSigma);
            points.push({ x, y });
        }
        
        // 计算回归
        const result = calculateSimpleRegression(points);
        allSamplingData.push({
            id: i,
            ...result
        });
    }

    // 显示结果区域
    document.getElementById('sampling-results').classList.remove('hidden');
    
    // 更新统计展示
    updateSamplingStatsUI();
    
    // 渲染图表
    renderSamplingChart();
    
    // 更新表格
    updateSamplingTable();
}

/**
 * 生成正态分布随机数 (Box-Muller)
 */
function generateNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdDev;
}

/**
 * 内部精简回归计算
 */
function calculateSimpleRegression(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    
    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
        sumYY += p.y * p.y;
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const a = meanY - b * meanX;
    
    // 相关系数 r
    const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    // t 统计量计算 (针对斜率)
    let sse = 0;
    let ssx = 0;
    for (const p of points) {
        const yHat = a + b * p.x;
        sse += Math.pow(p.y - yHat, 2);
        ssx += Math.pow(p.x - meanX, 2);
    }
    const mse = sse / (n - 2);
    const sb = Math.sqrt(mse / ssx);
    const t = b / sb;
    
    // p 值 (简单近似或设为 0)
    // 这里使用基础回归分析，F 统计量 = t^2
    const f = t * t;
    
    return { a, b, t, f, r, meanY };
}

/**
 * 更新图表下方统计量
 */
function updateSamplingStatsUI() {
    const slopes = allSamplingData.map(d => d.b);
    const meanB = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    const seB = Math.sqrt(slopes.reduce((acc, val) => acc + Math.pow(val - meanB, 2), 0) / (slopes.length - 1));
    
    document.getElementById('b-mean').textContent = meanB.toFixed(4);
    document.getElementById('b-se').textContent = seB.toFixed(4);
}

/**
 * 渲染/更新抽样直方图与拟合曲线
 */
function renderSamplingChart() {
    const container = document.getElementById('sampling-chart');
    if (!samplingChart) {
        samplingChart = echarts.init(container);
    }
    updateSamplingChart();
}

function updateSamplingChart() {
    if (!samplingChart) return;

    const slopes = allSamplingData.map(d => d.b);
    
    // 计算直方图数据
    const binCount = 40;
    const min = -3;
    const max = 3;
    const binWidth = (max - min) / binCount;
    const bins = new Array(binCount).fill(0);
    
    slopes.forEach(s => {
        if (s >= min && s <= max) {
            const idx = Math.floor((s - min) / binWidth);
            bins[Math.min(idx, binCount - 1)]++;
        }
    });

    const histData = bins.map((count, i) => [min + i * binWidth + binWidth / 2, count]);

    // 计算拟合曲线数据 (基于样本均值和标准误的分布)
    const meanB = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    const seB = Math.sqrt(slopes.reduce((acc, val) => acc + Math.pow(val - meanB, 2), 0) / (slopes.length - 1));
    
    const tCurveData = [];
    for (let x = -3; x <= 3; x += 0.1) {
        // 概率密度函数 (正态分布近似，因为 R 很大)
        const y = (1 / (seB * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - meanB) / seB, 2));
        // 缩放到直方图高度 (总数 * 组距)
        tCurveData.push([x, y * slopes.length * binWidth]);
    }

    const option = {
        animation: true,
        grid: { top: 40, right: 30, bottom: 40, left: 50 },
        xAxis: { 
            type: 'value', 
            min: -3, 
            max: 3,
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [
            {
                name: '斜率直方图',
                type: 'bar',
                data: isHistVisible ? histData : [],
                barWidth: '95%',
                itemStyle: { color: '#409eff', opacity: 0.6 }
            },
            {
                name: '斜率拟合t分布曲线',
                type: 'line',
                data: isTVisible ? tCurveData : [],
                smooth: true,
                showSymbol: false,
                lineStyle: { color: '#003366', width: 2 }
            }
        ]
    };

    samplingChart.setOption(option, true);
}

/**
 * 更新结果表格 (展示最后 10 次)
 */
function updateSamplingTable() {
    const tbody = document.querySelector('#sampling-table tbody');
    tbody.innerHTML = '';
    
    // 获取最后 10 次抽样并按实验号从小到大正序排序
    const lastTen = allSamplingData.slice(-10).sort((a, b) => a.id - b.id);
    
    lastTen.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${roundNumber(row.a, 3)}</td>
            <td>${roundNumber(row.b, 3)}</td>
            <td>${roundNumber(row.t, 3)}</td>
            <td>${row.t > 2 ? '< 0.05' : '> 0.05'}</td>
            <td>${roundNumber(row.f, 3)}</td>
            <td>${row.f > 4 ? '< 0.05' : '> 0.05'}</td>
            <td>${roundNumber(row.r, 3)}</td>
            <td>${roundNumber(row.meanY, 3)}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 下载完整 CSV 数据
 */
function downloadData() {
    if (allSamplingData.length === 0) return;
    
    // 添加 UTF-8 BOM (\uFEFF) 以解决 Excel 打开中文乱码问题
    let csvContent = "\uFEFF";
    csvContent += "实验号,截距a,斜率b,t,F,相关系数r,Y均值\n";
    
    allSamplingData.forEach(row => {
        csvContent += `${row.id},${row.a.toFixed(6)},${row.b.toFixed(6)},${row.t.toFixed(6)},${row.f.toFixed(6)},${row.r.toFixed(6)},${row.meanY.toFixed(6)}\n`;
    });
    
    // 使用 Blob 处理大文件并指定 MIME 类型
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `regression_sampling_R${allSamplingData.length}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // 释放内存
}
