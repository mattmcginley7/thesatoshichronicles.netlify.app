function formatDate(inputDate) {
    const parts = inputDate.split('-');
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

function calculateROI() {
    const amount = parseFloat(document.getElementById('investment').value);
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
                    resultEl.textContent = `Your $${amount.toFixed(2)} investment would be worth $${valueToday.toFixed(2)} today.`;
                });
        })
        .catch(() => {
            resultEl.textContent = 'Unable to retrieve price data.';
        });
}

document.getElementById('calc-btn').addEventListener('click', calculateROI);
