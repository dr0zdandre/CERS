document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');

    const apiUrl = '/rates';
    let ratesData = {};

    const fromWrapper = document.getElementById('from-currency-wrapper');
    const toWrapper = document.getElementById('to-currency-wrapper');
    const fromTrigger = document.getElementById('from-trigger');
    const toTrigger = document.getElementById('to-trigger');
    const fromDropdown = document.getElementById('from-dropdown');
    const toDropdown = document.getElementById('to-dropdown');

    if (!fromWrapper || !toWrapper || !fromTrigger || !toTrigger || !fromDropdown || !toDropdown) {
        console.error('Не найдены элементы селектов');
        return;
    }

    const fromSelected = fromTrigger.querySelector('.selected-value');
    const toSelected = toTrigger.querySelector('.selected-value');
    if (!fromSelected || !toSelected) return;

    let currentFrom = 'USD';
    let currentTo = 'RUB';

    function buildDropdown(dropdown, currencies, selectedCode) {
        dropdown.innerHTML = '';
        currencies.forEach(code => {
            const li = document.createElement('li');
            li.textContent = code;
            li.dataset.value = code;
            li.addEventListener('click', () => {
                if (dropdown === fromDropdown) {
                    setFromCurrency(code);
                } else if (dropdown === toDropdown) {
                    setToCurrency(code);
                }
            });
            if (code === selectedCode) {
                li.classList.add('active');
            }
            dropdown.appendChild(li);
        });
    }

    function setFromCurrency(code) {
        currentFrom = code;
        fromSelected.textContent = code;
        updateActiveClass(fromDropdown, code);
        closeAllDropdowns();
        convert();
    }

    function setToCurrency(code) {
        currentTo = code;
        toSelected.textContent = code;
        updateActiveClass(toDropdown, code);
        closeAllDropdowns();
        convert();
    }

    function updateActiveClass(dropdown, code) {
        const items = dropdown.querySelectorAll('li');
        items.forEach(li => {
            li.classList.toggle('active', li.dataset.value === code);
        });
    }

    function closeAllDropdowns() {
        fromWrapper.classList.remove('open');
        toWrapper.classList.remove('open');
    }

    fromTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = fromWrapper.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) fromWrapper.classList.add('open');
    });

    toTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = toWrapper.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) toWrapper.classList.add('open');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            closeAllDropdowns();
        }
    });
    
    // const apiUrl = '/rates';
    async function loadRates() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.status === 'ok') {
                ratesData = data.rates;
                const currencies = Object.keys(ratesData).sort();

                buildDropdown(fromDropdown, currencies, currentFrom);
                buildDropdown(toDropdown, currencies, currentTo);

                setFromCurrency(currentFrom);
                setToCurrency(currentTo);
                convert();
            } else {
                document.getElementById('result').textContent = 'Ошибка загрузки курсов';
            }
        } catch (e) {
            document.getElementById('result').textContent = 'Сервер недоступен';
        }
    }

    function convert() {
        const amountInput = document.getElementById('amount');
        const rawValue = amountInput.value.trim();
        const amount = parseFloat(rawValue);
    
        if (rawValue === '' || isNaN(amount)) {
            document.getElementById('result').textContent = 'Укажите сумму конвертации';
            document.getElementById('rate-info').textContent = '';
            return;
        }

        const from = currentFrom;
        const to = currentTo;

        if (!ratesData[from] || !ratesData[to]) {
            document.getElementById('result').textContent = 'Выберите валюты';
            document.getElementById('rate-info').textContent = '';
            return;
        }

        const crossRate = ratesData[from] / ratesData[to];
        const result = amount * crossRate;

        document.getElementById('result').textContent = `${result.toFixed(4)} ${to}`;
        document.getElementById('rate-info').textContent = `1 ${from} = ${crossRate.toFixed(4)} ${to}`;
    }

    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', convert);
    }

    loadRates();
});