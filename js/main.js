function getBitcoinPrice() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            // CoinGecko returns {"bitcoin":{"usd":12345}}
            var price = response.bitcoin.usd;
            // Round to the nearest whole dollar and format with commas
            document.getElementById("bitcoin-price").innerHTML = "$" + Math.round(price).toLocaleString();
        }
    };
    xhttp.open(
        "GET",
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        true
    );
    xhttp.send();
}

getBitcoinPrice();

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
        localStorage.setItem(storageKey, JSON.stringify(nextSaved));
    }

    updateProgress();
}

document.addEventListener("DOMContentLoaded", setupProgressTracker);
