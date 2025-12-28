document.addEventListener('DOMContentLoaded', function() {
    const departmentFilter = document.getElementById('departmentFilter');
    const sortBy = document.getElementById('sortBy');
    const resetFilters = document.getElementById('resetFilters');
    const tableBody = document.getElementById('suggestionsTableBody');
    const resultsCount = document.getElementById('resultsCount');
    const tableHeaders = document.querySelectorAll('#suggestionsTable thead th[data-sort]');

    // Tüm satırları sakla
    let allRows = Array.from(tableBody.querySelectorAll('tr'));

    // Sıralama ve filtreleme fonksiyonu
    function filterAndSort() {
        const selectedDepartment = departmentFilter.value;
        const sortValue = sortBy.value;

        // Filtreleme
        let filteredRows = allRows.filter(row => {
            if (selectedDepartment === 'all') return true;
            const rowDepartment = row.getAttribute('data-department') || '';
            return rowDepartment === selectedDepartment;
        });

        // Sıralama
        filteredRows.sort((a, b) => {
            switch (sortValue) {
                case 'department':
                    const deptA = (a.getAttribute('data-department') || '').toLowerCase();
                    const deptB = (b.getAttribute('data-department') || '').toLowerCase();
                    return deptA.localeCompare(deptB, 'tr');

                case 'department-desc':
                    const deptADesc = (a.getAttribute('data-department') || '').toLowerCase();
                    const deptBDesc = (b.getAttribute('data-department') || '').toLowerCase();
                    return deptBDesc.localeCompare(deptADesc, 'tr');

                case 'title':
                    const titleA = a.getAttribute('data-title') || '';
                    const titleB = b.getAttribute('data-title') || '';
                    return titleA.localeCompare(titleB, 'tr');

                case 'title-desc':
                    const titleADesc = a.getAttribute('data-title') || '';
                    const titleBDesc = b.getAttribute('data-title') || '';
                    return titleBDesc.localeCompare(titleADesc, 'tr');

                case 'saving-kwh':
                    const kwhA = parseFloat(a.getAttribute('data-saving-kwh') || 0);
                    const kwhB = parseFloat(b.getAttribute('data-saving-kwh') || 0);
                    return kwhB - kwhA;

                case 'saving-kwh-asc':
                    const kwhAAsc = parseFloat(a.getAttribute('data-saving-kwh') || 0);
                    const kwhBAsc = parseFloat(b.getAttribute('data-saving-kwh') || 0);
                    return kwhAAsc - kwhBAsc;

                case 'saving-tl':
                    const tlA = parseFloat(a.getAttribute('data-saving-tl') || 0);
                    const tlB = parseFloat(b.getAttribute('data-saving-tl') || 0);
                    return tlB - tlA;

                case 'saving-tl-asc':
                    const tlAAsc = parseFloat(a.getAttribute('data-saving-tl') || 0);
                    const tlBAsc = parseFloat(b.getAttribute('data-saving-tl') || 0);
                    return tlAAsc - tlBAsc;

                case 'co2':
                    const co2A = parseFloat(a.getAttribute('data-saving-co2') || 0);
                    const co2B = parseFloat(b.getAttribute('data-saving-co2') || 0);
                    return co2B - co2A;

                case 'co2-asc':
                    const co2AAsc = parseFloat(a.getAttribute('data-saving-co2') || 0);
                    const co2BAsc = parseFloat(b.getAttribute('data-saving-co2') || 0);
                    return co2AAsc - co2BAsc;

                case 'month':
                    const monthA = parseInt(a.querySelector('td[data-month-value]')?.getAttribute('data-month-value') || 0);
                    const monthB = parseInt(b.querySelector('td[data-month-value]')?.getAttribute('data-month-value') || 0);
                    return monthB - monthA;

                case 'month-old':
                    const monthAOld = parseInt(a.querySelector('td[data-month-value]')?.getAttribute('data-month-value') || 0);
                    const monthBOld = parseInt(b.querySelector('td[data-month-value]')?.getAttribute('data-month-value') || 0);
                    return monthAOld - monthBOld;

                default:
                    return 0;
            }
        });

        // Tabloyu temizle ve sıralanmış satırları ekle
        tableBody.innerHTML = '';
        filteredRows.forEach(row => {
            tableBody.appendChild(row);
        });

        // Sonuç sayısını güncelle
        updateResultsCount(filteredRows.length, allRows.length);
    }

    // Sonuç sayısını göster
    function updateResultsCount(filtered, total) {
        if (resultsCount) {
            if (filtered === total) {
                resultsCount.textContent = `Toplam ${total} öneri gösteriliyor`;
            } else {
                resultsCount.textContent = `${filtered} öneri gösteriliyor (${total} toplam)`;
            }
        }
    }

    // Başlangıç sayısını göster
    updateResultsCount(allRows.length, allRows.length);

    // Event listeners
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterAndSort);
    }

    if (sortBy) {
        sortBy.addEventListener('change', filterAndSort);
    }

    if (resetFilters) {
        resetFilters.addEventListener('click', function() {
            departmentFilter.value = 'all';
            sortBy.value = 'department';
            filterAndSort();
        });
    }

    // Başlık tıklama ile sıralama
    tableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            const sortType = this.getAttribute('data-sort');
            
            // Mevcut sıralama durumunu kontrol et
            let newSortValue = sortType;
            if (sortBy.value === sortType) {
                newSortValue = sortType + '-desc';
            } else if (sortBy.value === sortType + '-desc') {
                newSortValue = sortType + '-asc';
            } else {
                newSortValue = sortType;
            }

            sortBy.value = newSortValue;
            filterAndSort();
        });
    });
});




