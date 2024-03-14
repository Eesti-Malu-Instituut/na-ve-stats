// script.js

const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: ''
};

const fetchAllikad = async () => {
    
    const allikadQuery = 'select kood, allikas from allikad where isFilter = 1';

    const allikadResponse = await fetch('/query', { ...options, body: JSON.stringify({ query: allikadQuery }) });

    const allikadResult = await allikadResponse.json();

    const filtersDiv = document.getElementById('filters');

    const switchLabels = {'off': 'x', 'na': '.', 'on': 'v'}
    // Create toggle controls for each row
    allikadResult.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');

        // Create toggle buttons for "off", "na", and "on"
        ['off', 'na', 'on'].forEach((value) => {
            const toggleInput = document.createElement('button');
            toggleInput.type = 'button';
            toggleInput.name = row.kood;
            toggleInput.id = `toggle-${value}`;
            toggleInput.value = value;
            toggleInput.textContent = switchLabels[value]; // Add text content to buttons
            toggleInput.classList.add('toggle'); // Add toggle class
            toggleInput.classList.add(value); // Add class for styling (e.g., off, na, on)
            if (value === 'na') {
                toggleInput.setAttribute('checked', 'true');
            }
            rowDiv.appendChild(toggleInput);
        });

        // Display the value of "allikas" as a label
        const label = document.createElement('label');
        label.textContent = row.allikas;
        rowDiv.appendChild(label);

        // Add rowDiv to the filtersDiv
        filtersDiv.appendChild(rowDiv);
    });

    document.querySelectorAll('.toggle').forEach((toggleLabel) => {
        toggleLabel.addEventListener('click', (e) => {
            // Ucheck other buttons in the same row
            const row = e.target.parentElement;
            row.querySelectorAll('button[type="button"]').forEach((button) => {
                button.removeAttribute('checked');
            });
            // Check the clicked button
            e.target.setAttribute('checked', 'true');
            const selectedRows = [];
            document.querySelectorAll('button[type="button"][checked="true"]').forEach((checkedFilter) => {
                // skip the na values as they are not relevant
                if (checkedFilter.value === 'na') {
                    return;
                }
                const kood = checkedFilter.name;
                const value = checkedFilter.value;
                selectedRows.push(`${kood}: ${value}`);
            });
            document.getElementById('state').value = selectedRows.join('\n');
        });
    });
};

fetchAllikad()
