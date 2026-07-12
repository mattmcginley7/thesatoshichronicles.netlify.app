function parseNumber(value) {
    return parseFloat(value.replace(/,/g, ''));
}

function formatCurrency(value) {
    return Math.round(value).toLocaleString();
}

function formatPercent(value) {
    return `${Math.round(value * 1000) / 10}%`;
}

const wealthRaceConfig = [
    { key: 'savings', label: 'Bank savings', rate: 0.01, color: '#94a3b8' },
    { key: 'treasuries', label: 'Treasury bonds', rate: 0.04, color: '#60a5fa' },
    { key: 'sp500', label: 'S&P 500', rate: 0.10, color: '#34d399' },
    { key: 'bitcoin', label: 'Bitcoin', rate: 0.24, color: '#f7931a' }
];

let wealthRaceChart;

function formatDollars(value) {
    return `$${formatCurrency(value)}`;
}

function formatSignedDollars(value) {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}$${formatCurrency(Math.abs(value))}`;
}

function updateRangeReadout(inputId, displayId, suffix) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    if (!input || !display) return;
    const value = parseFloat(input.value);
    display.textContent = suffix === 'years'
        ? `${value} year${value === 1 ? '' : 's'}`
        : `${value}%`;
}

function calculateCompoundedValue(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
}

function renderWealthRace() {
    const amountInput = document.getElementById('wealth-amount');
    const yearsInput = document.getElementById('wealth-years');
    const inflationInput = document.getElementById('inflation-rate');
    const bitcoinInput = document.getElementById('bitcoin-rate');
    const tableBody = document.getElementById('wealth-table-body');
    const summary = document.getElementById('wealth-summary');
    const insight = document.getElementById('wealth-insight');
    const canvas = document.getElementById('wealth-race-chart');

    if (!amountInput || !yearsInput || !inflationInput || !bitcoinInput || !tableBody || !summary || !insight || !canvas) return;

    updateRangeReadout('wealth-years', 'wealth-years-display', 'years');
    updateRangeReadout('inflation-rate', 'inflation-rate-display', 'percent');
    updateRangeReadout('bitcoin-rate', 'bitcoin-rate-display', 'percent');

    const principal = parseNumber(amountInput.value) || 0;
    const years = parseInt(yearsInput.value, 10);
    const inflationRate = parseFloat(inflationInput.value) / 100;
    const bitcoinRate = parseFloat(bitcoinInput.value) / 100;

    const rows = wealthRaceConfig.map(option => {
        const rate = option.key === 'bitcoin' ? bitcoinRate : option.rate;
        const nominal = calculateCompoundedValue(principal, rate, years);
        const real = nominal / Math.pow(1 + inflationRate, years);
        return { ...option, rate, nominal, real };
    });

    const bitcoin = rows.find(row => row.key === 'bitcoin');
    const savings = rows.find(row => row.key === 'savings');
    const bestNonBitcoin = rows.filter(row => row.key !== 'bitcoin').sort((a, b) => b.real - a.real)[0];
    const leader = [...rows].sort((a, b) => b.real - a.real)[0];
    const bitcoinMultiple = bestNonBitcoin && bestNonBitcoin.real > 0 ? bitcoin.real / bestNonBitcoin.real : 0;
    const inflationHurdle = calculateCompoundedValue(principal, inflationRate, years);

    summary.innerHTML = `
        <div><strong>${formatDollars(principal)}</strong><span>Starting money</span></div>
        <div><strong>${formatDollars(inflationHurdle)}</strong><span>Future dollars needed to equal today's buying power</span></div>
        <div><strong>${leader.label}</strong><span>Highest inflation-adjusted outcome after ${years} years</span></div>
        <div><strong>${formatSignedDollars(savings.real - principal)}</strong><span>Savings real gain/loss vs. today</span></div>
    `;

    tableBody.innerHTML = rows.map(row => {
        const realDelta = row.real - principal;
        const deltaClass = realDelta >= 0 ? 'positive' : 'negative';
        return `
            <tr>
                <td data-label="Option"><span class="wealth-dot" style="--dot-color: ${row.color}"></span>${row.label}</td>
                <td data-label="Annual return">${formatPercent(row.rate)}</td>
                <td data-label="Nominal value">${formatDollars(row.nominal)}</td>
                <td data-label="Real value">${formatDollars(row.real)}</td>
                <td data-label="Real gain/loss" class="${deltaClass}">${formatSignedDollars(realDelta)}</td>
            </tr>
        `;
    }).join('');

    insight.innerHTML = `
        <h3>What the race shows</h3>
        <p>At these settings, <strong>${leader.label}</strong> leads on real purchasing power. Bitcoin ends at <strong>${bitcoinMultiple.toFixed(1)}×</strong> the best non-Bitcoin real outcome, while the inflation hurdle means ${formatDollars(inflationHurdle)} future dollars are needed just to preserve the spending power of ${formatDollars(principal)} today.</p>
    `;

    if (typeof Chart === 'undefined') return;

    const chartYears = Array.from({ length: years + 1 }, (_, index) => index);
    const datasets = rows.map(row => ({
        label: row.label,
        data: chartYears.map(year => calculateCompoundedValue(principal, row.rate, year)),
        borderColor: row.color,
        backgroundColor: `${row.color}26`,
        borderWidth: row.key === leader.key ? 4 : 2.5,
        fill: row.key === 'bitcoin' ? 'origin' : false,
        tension: 0.32,
        pointRadius: yearPointRadius(years),
        pointHoverRadius: 6,
        pointBackgroundColor: row.color,
        pointBorderColor: '#101418',
        pointBorderWidth: 2
    }));

    datasets.push({
        label: 'Inflation hurdle',
        data: chartYears.map(year => calculateCompoundedValue(principal, inflationRate, year)),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderDash: [8, 6],
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0
    });

    const ctx = canvas.getContext('2d');
    if (wealthRaceChart) wealthRaceChart.destroy();
    wealthRaceChart = new Chart(ctx, {
        type: 'line',
        data: { labels: chartYears, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f5f1e8',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: isCompactWealthViewport() ? 8 : 12,
                        padding: isCompactWealthViewport() ? 10 : 18,
                        font: { family: 'Inter', weight: '700', size: isCompactWealthViewport() ? 10 : 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(7, 9, 11, 0.94)',
                    borderColor: 'rgba(247, 147, 26, 0.35)',
                    borderWidth: 1,
                    padding: 12,
                    titleColor: '#ffffff',
                    bodyColor: '#e7dfd2',
                    callbacks: {
                        title: items => `Year ${items[0].label}`,
                        label: context => `${context.dataset.label}: ${formatDollars(context.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: !isCompactWealthViewport(), text: 'Years', color: '#e7dfd2', font: { weight: '800' } },
                    ticks: { color: '#cbd5e1', maxRotation: 0, maxTicksLimit: isCompactWealthViewport() ? 6 : 11 },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#cbd5e1', maxTicksLimit: isCompactWealthViewport() ? 5 : 8, callback: value => formatDollars(value) },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                }
            }
        }
    });
}

function yearPointRadius(years) {
    return years > 18 ? 0 : 3;
}

function isCompactWealthViewport() {
    return window.matchMedia('(max-width: 720px)').matches;
}

['wealth-amount', 'wealth-years', 'inflation-rate', 'bitcoin-rate'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.addEventListener('input', renderWealthRace);
});

if (document.getElementById('wealth-race-chart')) {
    renderWealthRace();
}
