document.addEventListener("DOMContentLoaded", function () {
    var audienceExplanations = [
        {
            id: "fitness-guy",
            title: "A Fitness Guy",
            text: "Bitcoin is like strength you can’t fake. There’s no shortcuts, no printing more plates, and no cheating the system — you either put in the work early or you don’t. Over time, discipline beats hype."
        },
        {
            id: "video-gamer",
            title: "A Video Gamer",
            text: "Bitcoin is a fixed-supply in-game currency that can’t be duped, nerfed, or patched. Early players earned it cheap, late players pay more, and the rules never change mid-season."
        },
        {
            id: "sports-fan",
            title: "A Sports Fan",
            text: "Bitcoin is a game with a fixed number of roster spots. If more people want to play but the league never expands, the value of each spot goes up."
        },
        {
            id: "finance-professional",
            title: "A Finance Professional",
            text: "Bitcoin is a decentralized, bearer asset with a fixed supply and no counterparty risk. It functions as a monetary base layer, not a company, and its value comes from enforced scarcity rather than cash flows."
        },
        {
            id: "skeptic",
            title: "A Skeptic",
            text: "Bitcoin isn’t about getting rich — it’s about opting out of money that loses value by design. You don’t need to believe in it; you just need to notice that the rules never change."
        },
        {
            id: "normie",
            title: "A Normie",
            text: "Bitcoin is digital money that no one can inflate or control. More people want it over time, but there will never be more of it — that’s basically the whole point."
        },
        {
            id: "parents",
            title: "Your Parents",
            text: "Bitcoin is like digital gold you can send instantly anywhere in the world. It’s designed so no government or company can change the rules or print more of it."
        },
        {
            id: "girlfriend",
            title: "Your Girlfriend",
            text: "Bitcoin is savings you don’t have to trust anyone with. It’s boring when done right — you just hold it and let time do the work."
        },
        {
            id: "eight-year-old",
            title: "An Eight-Year-Old",
            text: "Bitcoin is money that only has a certain number of coins forever. If lots of people want it and you can’t make more, each coin becomes more special."
        }
    ];

    var accordionRoot = document.getElementById("explain-accordion");
    if (!accordionRoot) {
        return;
    }

    accordionRoot.innerHTML = audienceExplanations.map(function (item, index) {
        return '<article class="audience-item">' +
            '<button class="audience-trigger" type="button" aria-expanded="' + (index === 0 ? "true" : "false") + '" aria-controls="panel-' + item.id + '" id="trigger-' + item.id + '">' +
            '<span>' + item.title + '</span>' +
            '<span class="chevron" aria-hidden="true">⌄</span>' +
            '</button>' +
            '<div class="audience-panel' + (index === 0 ? " is-open" : "") + '" id="panel-' + item.id + '" role="region" aria-labelledby="trigger-' + item.id + '">' +
            '<p class="audience-text">' + item.text + '</p>' +
            '<button class="copy-button" type="button" data-copy-text="' + encodeURIComponent(item.text) + '">Copy</button>' +
            '</div>' +
            '</article>';
    }).join("");

    var triggers = accordionRoot.querySelectorAll(".audience-trigger");

    function setPanelState(trigger, shouldOpen) {
        var panelId = trigger.getAttribute("aria-controls");
        var panel = document.getElementById(panelId);
        if (!panel) {
            return;
        }

        trigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        if (shouldOpen) {
            panel.classList.add("is-open");
            panel.style.maxHeight = panel.scrollHeight + "px";
        } else {
            panel.classList.remove("is-open");
            panel.style.maxHeight = "0px";
        }
    }

    triggers.forEach(function (trigger, index) {
        var isInitiallyOpen = index === 0;
        setPanelState(trigger, isInitiallyOpen);

        trigger.addEventListener("click", function () {
            var isExpanded = trigger.getAttribute("aria-expanded") === "true";

            triggers.forEach(function (otherTrigger) {
                setPanelState(otherTrigger, false);
            });

            if (!isExpanded) {
                setPanelState(trigger, true);
            }
        });
    });

    window.addEventListener("resize", function () {
        triggers.forEach(function (trigger) {
            if (trigger.getAttribute("aria-expanded") === "true") {
                setPanelState(trigger, true);
            }
        });
    });

    accordionRoot.addEventListener("click", function (event) {
        var copyButton = event.target.closest(".copy-button");
        if (!copyButton) {
            return;
        }

        var textToCopy = decodeURIComponent(copyButton.getAttribute("data-copy-text") || "");

        function showCopiedState() {
            var originalLabel = copyButton.textContent;
            copyButton.textContent = "Copied!";
            copyButton.disabled = true;
            window.setTimeout(function () {
                copyButton.textContent = originalLabel;
                copyButton.disabled = false;
            }, 1200);
        }

        function fallbackCopy(text) {
            var helper = document.createElement("textarea");
            helper.value = text;
            helper.setAttribute("readonly", "");
            helper.style.position = "absolute";
            helper.style.left = "-9999px";
            document.body.appendChild(helper);
            helper.select();
            document.execCommand("copy");
            document.body.removeChild(helper);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(showCopiedState).catch(function () {
                fallbackCopy(textToCopy);
                showCopiedState();
            });
            return;
        }

        fallbackCopy(textToCopy);
        showCopiedState();
    });
});
