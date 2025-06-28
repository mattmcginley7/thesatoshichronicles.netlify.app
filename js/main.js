function getBitcoinPrice() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            var price = response.bpi.USD.rate;
            document.getElementById("bitcoin-price").innerHTML = price + " USD";
        }
    };
    xhttp.open("GET", "https://api.coindesk.com/v1/bpi/currentprice.json", true);
    xhttp.send();
}

getBitcoinPrice();
