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
        loadHistory();
    }

    function setToCurrency(code) {
        currentTo = code;
        toSelected.textContent = code;
        updateActiveClass(toDropdown, code);
        closeAllDropdowns();
        convert();
        loadHistory();
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

    // === Кнопка Swap ===
    const swapBtn = document.getElementById('swapBtn');
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = currentFrom;
            currentFrom = currentTo;
            currentTo = temp;
            fromSelected.textContent = currentFrom;
            toSelected.textContent = currentTo;
            updateActiveClass(fromDropdown, currentFrom);
            updateActiveClass(toDropdown, currentTo);
            convert();
            loadHistory();
        });
    }

    // === График истории ===
    let historyChart = null;
    let historyData = [];
    const currentYear = new Date().getFullYear();
    const MIN_YEAR = 1998;

    function filterByStep(data, step) {
        if (step === 'day') return data;
        function parseDate(dateStr) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                return { day: parseInt(parts[0]), month: parseInt(parts[1]), year: parseInt(parts[2]) };
            }
            return { day: 1, month: 1, year: 2000 };
        }
        const filtered = [];
        let lastKey = '';
        for (const item of data) {
            const d = parseDate(item.date);
            const month = d.month;
            const year = d.year;
            let key;
            switch (step) {
                case 'month': key = `${year}-${month}`; break;
                case 'quarter': key = `${year}-Q${Math.ceil(month / 3)}`; break;
                case 'halfyear': key = `${year}-${month <= 6 ? 'H1' : 'H2'}`; break;
                case 'year': key = `${year}`; break;
                default: key = `${year}-${month}`;
            }
            if (key !== lastKey) {
                filtered.push(item);
                lastKey = key;
            } else {
                filtered[filtered.length - 1] = item;
            }
        }
        return filtered;
    }

    function buildYearFromOptions() {
        const yearFromSelect = document.getElementById('yearFrom');
        if (!yearFromSelect) return;
        yearFromSelect.innerHTML = '';
        for (let y = MIN_YEAR; y <= currentYear; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === 2020) opt.selected = true;
            yearFromSelect.appendChild(opt);
        }
    }

    function buildYearToOptions() {
        const yearToSelect = document.getElementById('yearTo');
        if (!yearToSelect) return;
        const yearFromVal = parseInt(document.getElementById('yearFrom').value);
        const selectedVal = parseInt(yearToSelect.value) || currentYear;
        yearToSelect.innerHTML = '';
        for (let y = yearFromVal; y <= currentYear; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === selectedVal || (y === currentYear && selectedVal > currentYear)) opt.selected = true;
            yearToSelect.appendChild(opt);
        }
    }

    async function loadHistory() {
        const yearFrom = document.getElementById('yearFrom').value;
        const yearTo = document.getElementById('yearTo').value;
        const step = document.getElementById('chartStep').value;
        const loading = document.getElementById('historyLoading');
        const error = document.getElementById('historyError');
        const stats = document.getElementById('historyStats');
        if (parseInt(yearFrom) > parseInt(yearTo)) {
            error.textContent = 'Год начала не может быть больше года окончания';
            error.style.display = 'block';
            loading.style.display = 'none';
            stats.style.display = 'none';
            return;
        }
        loading.style.display = 'block';
        error.style.display = 'none';
        stats.style.display = 'none';
        try {
            let url;
            if (currentTo === 'RUB') {
                url = `/api/history/${currentFrom}?year_from=${yearFrom}&year_to=${yearTo}`;
            } else {
                url = `/api/history/cross/${currentFrom}/${currentTo}?year_from=${yearFrom}&year_to=${yearTo}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'ok' && data.data && data.data.length > 0) {
                historyData = data.data;
                const filtered = filterByStep(historyData, step);
                updateChart(filtered);
                updateStats(filtered);
                stats.style.display = 'grid';
            } else {
                error.textContent = 'Нет данных за выбранный период';
                error.style.display = 'block';
            }
        } catch (e) {
            error.textContent = 'Ошибка загрузки: ' + e.message;
            error.style.display = 'block';
        } finally {
            loading.style.display = 'none';
        }
    }

    function updateChart(data) {
        const ctx = document.getElementById('historyChart').getContext('2d');
        if (historyChart) historyChart.destroy();
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        if (resetZoomBtn) resetZoomBtn.style.display = 'none';
        const labels = data.map(d => d.date);
        const values = data.map(d => d.value);
        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentFrom}/${currentTo}`,
                    data: values,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#4caf50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(36, 36, 36, 0.9)',
                        titleColor: '#e0e0e0',
                        bodyColor: '#4caf50',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: { label: (ctx) => `Курс: ${ctx.parsed.y.toFixed(4)}` }
                    },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                        pan: { enabled: true, mode: 'xy' },
                        limits: {
                            x: { min: 'original', max: 'original' },
                            y: { min: 0, max: function(ctx) {
                                const maxVal = Math.max(...ctx.chart.data.datasets[0].data);
                                return maxVal * 3;
                            }}
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#888', maxTicksLimit: 10, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });

        if (historyChart && resetZoomBtn) {
            const chartContainer = document.getElementById('historyChart').parentElement;
            chartContainer.addEventListener('wheel', () => {
                resetZoomBtn.style.display = 'block';
            }, { capture: true });
            chartContainer.addEventListener('dblclick', () => {
                historyChart.resetZoom();
                resetZoomBtn.style.display = 'none';
            });
        }
    }

    function updateStats(data) {
        const values = data.map(d => d.value);
        const current = values[values.length - 1];
        const first = values[0];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const change = first !== 0 ? ((current - first) / first * 100).toFixed(2) : '0.00';
        document.getElementById('currentValue').textContent = current.toFixed(4);
        document.getElementById('minValue').textContent = min.toFixed(4);
        document.getElementById('maxValue').textContent = max.toFixed(4);
        const changeEl = document.getElementById('changeValue');
        changeEl.textContent = `${change > 0 ? '+' : ''}${change}%`;
        changeEl.className = `value ${parseFloat(change) >= 0 ? 'red' : 'green'}`;
    }

    const loadHistoryBtn = document.getElementById('loadHistoryBtn');
    if (loadHistoryBtn) loadHistoryBtn.addEventListener('click', loadHistory);

    buildYearFromOptions();
    buildYearToOptions();

    const yearFromSelect = document.getElementById('yearFrom');
    if (yearFromSelect) {
        yearFromSelect.addEventListener('change', () => { buildYearToOptions(); loadHistory(); });
    }

    const yearToSelect = document.getElementById('yearTo');
    if (yearToSelect) yearToSelect.addEventListener('change', loadHistory);

    const chartStepSelect = document.getElementById('chartStep');
    if (chartStepSelect) chartStepSelect.addEventListener('change', loadHistory);

    const resetZoomBtn = document.getElementById('resetZoomBtn');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            if (historyChart) {
                historyChart.resetZoom();
                resetZoomBtn.style.display = 'none';
            }
        });
    }
});