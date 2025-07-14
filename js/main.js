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
