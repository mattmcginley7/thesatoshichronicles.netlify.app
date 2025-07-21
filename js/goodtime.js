document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('check-time-btn');
    if (btn) {
        btn.addEventListener('click', function () {
            var result = document.getElementById('time-result');
            if (result) {
                result.textContent = 'Yes!';
            }
        });
    }
});
