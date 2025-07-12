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

function calculateCagr() {
    const amount = parseNumber(document.getElementById('cagr-amount').value);
    const rate = parseFloat(document.getElementById('cagr-rate').value) / 100;
    const resultEl = document.getElementById('cagr-result');

    if (!amount) {
        resultEl.textContent = 'Please enter a valid amount.';
        return;
    }

    const years = [1, 3, 5, 10, 20];
    let output = '';
    years.forEach(y => {
        const value = amount * Math.pow(1 + rate, y);
        output += `${y} year${y > 1 ? 's' : ''}: $${formatCurrency(value)}<br>`;
    });
    resultEl.innerHTML = output;
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
