function getBitcoinPrice() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            // CoinGecko returns {"bitcoin":{"usd":12345}}
            var price = response.bitcoin.usd;
            // Round to the nearest whole dollar and format with commas
            document.getElementById("bitcoin-price").innerHTML = "$" + Math.round(price).toLocaleString();
            var priceUpdated = document.getElementById("price-updated");
            if (priceUpdated) {
                var timestamp = new Date();
                priceUpdated.textContent = timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }
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

        var header = card.querySelector(".blog-header");
        var title = card.querySelector(".blog-title");
        var firstParagraph = card.querySelector("p:not(.blog-meta):not(.blog-excerpt)");
        if (header && title && firstParagraph && !header.querySelector(".blog-excerpt")) {
            var excerpt = document.createElement("p");
            excerpt.className = "blog-excerpt";
            excerpt.textContent = firstParagraph.textContent.trim().slice(0, 180);
            if (firstParagraph.textContent.trim().length > 180) {
                excerpt.textContent += "…";
            }
            title.insertAdjacentElement("afterend", excerpt);
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

document.addEventListener("DOMContentLoaded", function () {
    setupProgressTracker();
    setupBlogDiscovery();
});
