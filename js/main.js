// Prices and chart both come from Coinbase BTC-USD trades, never sample data.
function setupBitcoinMarket() {
    const price = document.getElementById('bitcoin-price');
    if (!price) return;
    const chart = document.getElementById('price-chart');
    const message = document.getElementById('chart-message');
    const status = document.getElementById('market-status');
    const change = document.getElementById('price-change');
    const footnote = document.getElementById('market-footnote');
    const buttons = document.querySelectorAll('[data-days]');
    const cache = new Map();
    let selected = '1';
    let requestId = 0;
    const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    async function json(url) {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Price service unavailable');
        return response.json();
    }
    async function fetchMarket(days) {
        try {
            return await json('/.netlify/functions/bitcoin-market?days=' + days);
        } catch {
            // Also works on static previews or hosts without Netlify Functions.
            const granularity = { '1': 3600, '7': 21600, '30': 86400 }[days];
            const end = new Date();
            const start = new Date(end.getTime() - Number(days) * 86400000);
            const base = 'https://api.exchange.coinbase.com/products/BTC-USD/';
            const [ticker, candles] = await Promise.all([
                json(base + 'ticker'),
                json(base + `candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`)
            ]);
            return { ticker, candles };
        }
    }
    function render(data, days) {
        const current = Number(data.ticker?.price);
        const timestamp = Date.parse(data.ticker?.time);
        if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(timestamp) || !Array.isArray(data.candles)) throw new Error('Invalid market data');
        const cutoff = timestamp - Number(days) * 86400000;
        const points = data.candles.filter(row => Array.isArray(row) && Number.isFinite(row[0]) && Number.isFinite(row[4]) && row[4] > 0 && row[0] * 1000 >= cutoff && row[0] * 1000 <= timestamp)
            .map(row => [row[0] * 1000, row[4]]).sort((a, b) => a[0] - b[0]);
        if (points.length < 2) throw new Error('History unavailable');
        points.push([timestamp, current]);
        price.textContent = currency(current);
        if (!chart) { price.title = 'Coinbase Exchange · ' + new Date(timestamp).toLocaleString(); return; }
        const percent = (current / points[0][1] - 1) * 100;
        const positive = percent >= 0;
        change.textContent = `${positive ? '+' : ''}${percent.toFixed(2)}% · ${days === '1' ? '24h' : days + 'd'}`;
        change.className = 'price-change ' + (positive ? 'positive' : 'negative');
        const values = points.map(point => point[1]);
        const min = Math.min(...values), max = Math.max(...values);
        const spread = max - min || current * .001;
        const coords = points.map(point => [((point[0] - points[0][0]) / (timestamp - points[0][0])) * 600, 160 - (point[1] - min) / spread * 140]);
        const line = coords.map((point, i) => `${i ? 'L' : 'M'}${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ');
        document.getElementById('price-line').setAttribute('d', line);
        document.getElementById('price-area').setAttribute('d', line + ' L600,180 L0,180 Z');
        chart.style.color = positive ? '#29765b' : '#b74435';
        chart.setAttribute('aria-label', `Bitcoin USD ${days === '1' ? '24-hour' : days + '-day'} history. From ${currency(points[0][1])} to ${currency(current)}. ${percent.toFixed(2)} percent change. Low ${currency(min)}, high ${currency(max)}.`);
        const dateFormat = days === '1' ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' };
        document.getElementById('chart-start').textContent = new Date(points[0][0]).toLocaleString([], dateFormat);
        document.getElementById('chart-end').textContent = new Date(timestamp).toLocaleString([], dateFormat);
        document.getElementById('chart-caption').textContent = `Low ${currency(min)} · High ${currency(max)}`;
        message.hidden = true;
        const stale = Date.now() - timestamp > 900000;
        status.textContent = stale ? 'Delayed' : 'Live price';
        status.className = 'market-status' + (stale ? '' : ' is-live');
        footnote.textContent = `Coinbase Exchange · ${new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · Refreshes every 5 min`;
    }
    async function update() {
        const id = ++requestId, days = selected;
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.days === days)));
        if (chart) {
            document.getElementById('price-line').removeAttribute('d');
            document.getElementById('price-area').removeAttribute('d');
            chart.setAttribute('aria-label', 'Bitcoin price history is loading');
            message.hidden = false; message.textContent = 'Loading price history…';
            status.textContent = 'Updating'; status.className = 'market-status';
            change.textContent = 'Loading market data';
        }
        try {
            const saved = cache.get(days);
            const data = saved && Date.now() - saved.at < 300000 ? saved.data : await fetchMarket(days);
            if (id !== requestId) return;
            render(data, days);
            cache.set(days, { data, at: saved && data === saved.data ? saved.at : Date.now() });
        } catch {
            if (id !== requestId) return;
            price.textContent = 'Unavailable';
            if (chart) {
                message.textContent = 'Market data unavailable. Please try again shortly.';
                status.textContent = 'Offline'; status.className = 'market-status';
                change.textContent = '—';
                chart.setAttribute('aria-label', 'Bitcoin price history unavailable');
                document.getElementById('chart-caption').textContent = 'Price history · USD';
                document.getElementById('chart-start').textContent = '—';
                document.getElementById('chart-end').textContent = '—';
                footnote.textContent = 'Coinbase Exchange · Automatically retries every 5 minutes';
            }
        }
    }
    buttons.forEach(button => button.addEventListener('click', () => { selected = button.dataset.days; update(); }));
    update();
    setInterval(() => { if (!document.hidden) update(); }, 300000);
}

setupBitcoinMarket();

function setupProgressTracker() {
    var tracker = document.querySelector(".progress-tracker");
    if (!tracker) {
        return;
    }

    var storageKey = "starterKitProgress";
    var checkboxes = tracker.querySelectorAll('input[type="checkbox"]');
    var progressFill = tracker.querySelector(".progress-bar__fill");
    var progressValue = tracker.querySelector(".progress-value");
    var progressSummary = tracker.querySelector(".progress-summary");
    var progressMeter = tracker.querySelector(".progress-meter");
    var resetButton = tracker.querySelector(".progress-reset");
    var saved = {};

    try {
        saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (error) {
        saved = {};
    }

    checkboxes.forEach(function (checkbox) {
        if (saved[checkbox.id]) {
            checkbox.checked = true;
        }
        checkbox.addEventListener("change", updateProgress);
    });

    if (resetButton) {
        resetButton.addEventListener("click", function () {
            checkboxes.forEach(function (checkbox) {
                checkbox.checked = false;
            });
            updateProgress();
        });
    }

    function updateProgress() {
        var total = checkboxes.length;
        var completed = 0;

        checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) {
                completed += 1;
            }
        });

        var percent = total ? Math.round((completed / total) * 100) : 0;

        if (progressFill) {
            progressFill.style.width = percent + "%";
        }

        if (progressValue) {
            progressValue.textContent = percent + "%";
        }

        if (progressSummary) {
            progressSummary.textContent = completed + " of " + total + " steps complete";
        }

        if (progressMeter) {
            progressMeter.setAttribute("aria-valuenow", percent);
        }

        var nextSaved = {};
        checkboxes.forEach(function (checkbox) {
            nextSaved[checkbox.id] = checkbox.checked;
        });
        try { localStorage.setItem(storageKey, JSON.stringify(nextSaved)); } catch (error) { /* Storage may be disabled. */ }
    }

    updateProgress();
}

function setupBlogDiscovery() {
    var filterButtons = document.querySelectorAll(".filter-chip");
    var discoveryCards = document.querySelectorAll(".js-filter-card");
    var articleCards = document.querySelectorAll(".blog-card[data-topics]");
    var results = document.querySelector(".filter-results");

    if (!articleCards.length) {
        return;
    }

    articleCards.forEach(function (card) {
        var bodyText = card.innerText || "";
        var words = bodyText.trim().split(/\s+/).filter(Boolean).length;
        var readMinutes = Math.max(2, Math.round(words / 220));
        var meta = card.querySelector(".blog-meta");
        if (meta && meta.textContent.indexOf("min read") === -1) {
            meta.textContent = meta.textContent + " · " + readMinutes + " min read";
        }

    });

    if (!filterButtons.length || !discoveryCards.length) {
        return;
    }

    function applyFilter(topic) {
        var matchCount = 0;

        discoveryCards.forEach(function (card) {
            var topics = (card.getAttribute("data-topics") || "").split(",");
            var isMatch = topic === "all" || topics.indexOf(topic) !== -1;
            card.style.display = isMatch ? "flex" : "none";
            if (isMatch) {
                matchCount += 1;
            }
        });

        articleCards.forEach(function (card) {
            var topics = (card.getAttribute("data-topics") || "").split(",");
            var isMatch = topic === "all" || topics.indexOf(topic) !== -1;
            card.classList.toggle("is-hidden", !isMatch);
        });

        if (results) {
            results.textContent = "Showing " + matchCount + " article" + (matchCount === 1 ? "" : "s") + ".";
        }
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            filterButtons.forEach(function (item) {
                item.classList.remove("is-active");
            });
            button.classList.add("is-active");
            applyFilter(button.getAttribute("data-filter"));
        });
    });

    applyFilter("all");
}

function setupNavigationMenu() {
    var toggle = document.querySelector(".nav-menu-toggle");
    var menu = document.querySelector(".global-icon-nav");

    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener("click", function () {
        var isOpen = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });

    menu.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
            document.body.classList.remove("nav-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation menu");
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            document.body.classList.remove("nav-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation menu");
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setupNavigationMenu();
    setupProgressTracker();
    setupBlogDiscovery();
});
