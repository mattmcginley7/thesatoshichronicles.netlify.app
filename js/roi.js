function formatDate(inputDate) {
    const parts = inputDate.split('-');
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

function parseNumber(value) {
    return parseFloat(value.replace(/,/g, ''));
}

function formatCurrency(value) {
    return Math.round(value).toLocaleString();
}

function calculateROI() {
    const amount = parseNumber(document.getElementById('investment').value);
    const date = document.getElementById('purchase-date').value;
    const resultEl = document.getElementById('result');

    if (!amount || !date) {
        resultEl.textContent = 'Please enter a valid amount and date.';
        return;
    }

    const formattedDate = formatDate(date);
    fetch('https://api.coingecko.com/api/v3/coins/bitcoin/history?date=' + formattedDate)
        .then(response => response.json())
        .then(data => {
            const pastPrice = data.market_data.current_price.usd;
            return fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
                .then(r => r.json())
                .then(current => {
                    const currentPrice = current.bitcoin.usd;
                    const btcAmount = amount / pastPrice;
                    const valueToday = btcAmount * currentPrice;
                    resultEl.textContent = `Your $${formatCurrency(amount)} investment would be worth $${formatCurrency(valueToday)} today.`;
                });
        })
        .catch(() => {
            resultEl.textContent = 'Unable to retrieve price data.';
        });
}

document.getElementById('calc-btn').addEventListener('click', calculateROI);

function calculateMillion() {
    const amount = parseNumber(document.getElementById('invest-million').value);
    const resultEl = document.getElementById('result-million');

    if (!amount) {
        resultEl.textContent = 'Please enter a valid amount.';
        return;
    }

    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(r => r.json())
        .then(data => {
            const currentPrice = data.bitcoin.usd;
            const btcAmount = amount / currentPrice;
            const futureValue = btcAmount * 1000000;
            resultEl.textContent = `If Bitcoin reaches $1,000,000, your investment would be worth $${formatCurrency(futureValue)}.`;
        })
        .catch(() => {
            resultEl.textContent = 'Unable to retrieve price data.';
        });
}

document.getElementById('calc-million-btn').addEventListener('click', calculateMillion);

function updateCagrDisplay() {
    const rateInput = document.getElementById('cagr-rate');
    const display = document.getElementById('cagr-rate-display');
    if (rateInput && display) {
        display.textContent = rateInput.value + '%';
    }
}

let cagrChart;

function calculateCagr() {
    const amount = parseNumber(document.getElementById('cagr-amount').value);
    const rate = parseFloat(document.getElementById('cagr-rate').value) / 100;
    const resultEl = document.getElementById('cagr-result');

    if (!amount) {
        resultEl.textContent = 'Please enter a valid amount.';
        return;
    }

    const displayYears = [1, 3, 5, 10, 20];
    let output = '';
    displayYears.forEach(y => {
        const value = amount * Math.pow(1 + rate, y);
        output += `${y} year${y > 1 ? 's' : ''}: $${formatCurrency(value)}<br>`;
    });
    resultEl.innerHTML = output;

    const chartYears = Array.from({ length: 21 }, (_, i) => i);
    const chartValues = chartYears.map(y => amount * Math.pow(1 + rate, y));
    const ctx = document.getElementById('cagr-chart').getContext('2d');
    if (cagrChart) cagrChart.destroy();
    cagrChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartYears,
            datasets: [{
                label: 'Projected value',
                data: chartValues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `$${formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: val => '$' + formatCurrency(val)
                    }
                }
            }
        }
    });
}

['growth-bear','growth-base','growth-bull'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', () => {
            const rateInput = document.getElementById('cagr-rate');
            if (id === 'growth-bear') rateInput.value = 16;
            if (id === 'growth-base') rateInput.value = 24;
            if (id === 'growth-bull') rateInput.value = 30;
            updateCagrDisplay();
        });
    }
});

const cagrRateInput = document.getElementById('cagr-rate');
if (cagrRateInput) {
    cagrRateInput.addEventListener('input', updateCagrDisplay);
}

const cagrCalcBtn = document.getElementById('cagr-calc-btn');
if (cagrCalcBtn) {
    cagrCalcBtn.addEventListener('click', calculateCagr);
}

const convictionScenarios = {
    2017: [
        { drop: 0.38, headline: 'Headlines scream: "Bitcoin is dead."', friend: 'Your cousin says it is just a fad.' },
        { drop: 0.42, headline: 'Price crashes again.', friend: 'A group chat says you should have sold.' },
        { drop: 0.55, headline: 'Macro panic hits risk assets.', friend: 'A friend asks if crypto is over forever.' },
        { drop: 0.3, headline: 'Regulators threaten a crackdown.', friend: 'Someone sends you a panic meme.' }
    ],
    2021: [
        { drop: 0.32, headline: 'Leverage wipes out the market.', friend: 'Your colleague says you got lucky.' },
        { drop: 0.4, headline: 'Media says the top is in.', friend: 'A friend claims Bitcoin will be replaced.' },
        { drop: 0.28, headline: 'Exchange liquidity dries up.', friend: 'Your sibling says they sold.' },
        { drop: 0.5, headline: 'Another brutal leg down.', friend: 'Someone tells you to stop the pain.' }
    ],
    2024: [
        { drop: 0.25, headline: 'ETFs launch, then price fades.', friend: 'A friend says institutions are dumping.' },
        { drop: 0.33, headline: 'Volatility spikes overnight.', friend: 'A group chat posts "told you so".' },
        { drop: 0.2, headline: 'Macro headlines rattle markets.', friend: 'Someone says Bitcoin is too risky.' },
        { drop: 0.3, headline: 'A sudden flush shakes out weak hands.', friend: 'A co-worker asks if you sold yet.' }
    ]
};

const convictionState = {
    active: false,
    step: 0,
    startPrice: 0,
    currentPrice: 0,
    btcHoldings: 0,
    cash: 0,
    totalInvested: 0,
    scenario: [],
    soldOut: false
};

function setConvictionButtons(enabled) {
    ['conviction-sell', 'conviction-hold', 'conviction-buy'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !enabled;
    });
}

function addConvictionLog(message) {
    const log = document.getElementById('conviction-log');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = 'simulator-entry';
    entry.innerHTML = message;
    log.prepend(entry);
}

function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}

function updateConvictionStatus(text) {
    const status = document.getElementById('conviction-status');
    if (status) status.textContent = text;
}

function getHistoryPrice(date) {
    const formattedDate = formatDate(date);
    return fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}`)
        .then(response => response.json())
        .then(data => data.market_data.current_price.usd);
}

function getCurrentPrice() {
    return fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(response => response.json())
        .then(data => data.bitcoin.usd);
}

function startConvictionSimulation() {
    const amount = parseNumber(document.getElementById('conviction-amount').value);
    const year = document.getElementById('conviction-year').value;

    if (!amount || !year) {
        updateConvictionStatus('Enter a starting amount and select a buy date.');
        return;
    }

    const date = `${year}-01-01`;
    updateConvictionStatus('Loading historical price data...');
    setConvictionButtons(false);
    document.getElementById('conviction-log').innerHTML = '';

    Promise.all([getHistoryPrice(date), getCurrentPrice()])
        .then(([startPrice, currentPrice]) => {
            convictionState.active = true;
            convictionState.step = 0;
            convictionState.startPrice = startPrice;
            convictionState.currentPrice = startPrice;
            convictionState.btcHoldings = amount / startPrice;
            convictionState.cash = 0;
            convictionState.totalInvested = amount;
            convictionState.scenario = convictionScenarios[year] || [];
            convictionState.soldOut = false;
            convictionState.finalPrice = currentPrice;

            addConvictionLog(`You bought <strong>${(convictionState.btcHoldings).toFixed(4)} BTC</strong> at <strong>$${formatCurrency(startPrice)}</strong> per coin.`);
            updateConvictionStatus('The cycle begins. Brace yourself.');
            setConvictionButtons(true);
            showConvictionEvent();
        })
        .catch(() => {
            updateConvictionStatus('Unable to retrieve price data. Please try again.');
            setConvictionButtons(false);
        });
}

function showConvictionEvent() {
    if (!convictionState.active || convictionState.soldOut) return;

    if (convictionState.step >= convictionState.scenario.length) {
        finishConvictionSimulation();
        return;
    }

    const event = convictionState.scenario[convictionState.step];
    convictionState.currentPrice = convictionState.currentPrice * (1 - event.drop);
    const dropFromEntry = 1 - convictionState.currentPrice / convictionState.startPrice;

    addConvictionLog(
        `<strong>Crash ${convictionState.step + 1}:</strong> ${event.headline}<br>` +
        `Simulated price: <strong>$${formatCurrency(convictionState.currentPrice)}</strong> (${formatPercent(dropFromEntry)} below entry).<br>` +
        `<em>Friend text:</em> "${event.friend}"`
    );
    updateConvictionStatus('What do you do next?');
}

function handleConvictionChoice(action) {
    if (!convictionState.active) return;

    if (action === 'sell') {
        convictionState.cash += convictionState.btcHoldings * convictionState.currentPrice;
        convictionState.btcHoldings = 0;
        convictionState.soldOut = true;
        addConvictionLog(`You sold everything at <strong>$${formatCurrency(convictionState.currentPrice)}</strong>.`);
        finishConvictionSimulation();
        return;
    }

    if (action === 'buy') {
        const extraInvestment = 200;
        convictionState.totalInvested += extraInvestment;
        const extraBtc = extraInvestment / convictionState.currentPrice;
        convictionState.btcHoldings += extraBtc;
        addConvictionLog(`You bought $${formatCurrency(extraInvestment)} more and added <strong>${extraBtc.toFixed(4)} BTC</strong>.`);
    } else {
        addConvictionLog('You held your position and did nothing.');
    }

    convictionState.step += 1;
    showConvictionEvent();
}

function finishConvictionSimulation() {
    setConvictionButtons(false);
    const finalValue = convictionState.btcHoldings * convictionState.finalPrice + convictionState.cash;
    const hodlValue = (convictionState.totalInvested / convictionState.startPrice) * convictionState.finalPrice;

    addConvictionLog(
        `<strong>Cycle complete.</strong> Final price: <strong>$${formatCurrency(convictionState.finalPrice)}</strong>.<br>` +
        `Your ending value: <strong>$${formatCurrency(finalValue)}</strong>.<br>` +
        `If you simply HODLed every dollar invested: <strong>$${formatCurrency(hodlValue)}</strong>.`
    );
    addConvictionLog(
        '<strong>What most people did:</strong> Many sold after the second crash and missed the rebound.'
    );
    addConvictionLog(
        '<strong>Lesson:</strong> Bitcoin rewards conviction, not IQ.'
    );
    updateConvictionStatus('Simulation complete. Restart to try different choices.');
    convictionState.active = false;
}

const convictionStart = document.getElementById('conviction-start');
if (convictionStart) {
    convictionStart.addEventListener('click', startConvictionSimulation);
}

const convictionSell = document.getElementById('conviction-sell');
if (convictionSell) {
    convictionSell.addEventListener('click', () => handleConvictionChoice('sell'));
}

const convictionHold = document.getElementById('conviction-hold');
if (convictionHold) {
    convictionHold.addEventListener('click', () => handleConvictionChoice('hold'));
}

const convictionBuy = document.getElementById('conviction-buy');
if (convictionBuy) {
    convictionBuy.addEventListener('click', () => handleConvictionChoice('buy'));
}
