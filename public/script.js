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
        toggleLabel.addEventListener('click', async (e) => {
            // Disable all toggle buttons while the query runs
            document.querySelectorAll('.toggle').forEach((toggleButton) => {
                toggleButton.disabled = true;
            });
    
            // Record the start time
            const startTime = Date.now();
    
            // Update elapsed time every 100 milliseconds
            const updateInterval = setInterval(() => {
                const elapsedTime = (Date.now() - startTime) / 100; // Convert to tenths of a second
                const roundedTime = Math.round(elapsedTime) / 10; // Round to one decimal place
                document.getElementById('queryResult').textContent = `Elapsed Time: ${roundedTime.toFixed(1)} s`;
            }, 100); // Update interval set to 100 milliseconds
    
            // Ucheck other buttons in the same row
            const row = e.target.parentElement;
            row.querySelectorAll('button[type="button"]').forEach((button) => {
                button.removeAttribute('checked');
            });
            // Check the clicked button
            e.target.setAttribute('checked', 'true');
    
            // Build the list of allikas values to be included and excluded in the query
            const includedAllikas = [];
            const excludedAllikas = ['']; // Add an empty string to avoid SQL error because of missing value
            document.querySelectorAll('button[type="button"][checked="true"]').forEach((checkedFilter) => {
                // skip the na values as they are not relevant
                if (checkedFilter.value === 'na') {
                    return;
                }
                const kood = checkedFilter.name;
                if (checkedFilter.value === 'on') {
                    includedAllikas.push(kood);
                } else {
                    excludedAllikas.push(kood);
                }
            });
    
            if (includedAllikas.length > 0) {
                // Convert the arrays into SQL terms
                const includedAllikasTerm = includedAllikas.map(row => `'${row}'`).join(',');
                let countQuery = `SELECT DISTINCT k.persoon
                                    FROM repis.kirjed k`;
    
                //  add the JOIN for excluded allikas
                const excludedAllikasTerm = excludedAllikas.map(row => `'${row}'`).join(',');
                countQuery += ` LEFT JOIN (SELECT DISTINCT persoon FROM repis.kirjed WHERE allikas IN (${excludedAllikasTerm})) ex 
                                ON k.persoon = ex.persoon`;
    
                // Add the WHERE clause for included allikas and excluded persoon
                countQuery += ` WHERE k.allikas IN (${includedAllikasTerm})
                                AND k.persoon <> '0000000000'
                                AND ex.persoon IS NULL`;
    
                // Set the query value to the textarea
                document.getElementById('query').value = countQuery;
    
                // Fetch and process the count result
                const countResponse = await fetch('/query', { ...options, body: JSON.stringify({ query: countQuery }) });
                const countResult = await countResponse.json();
    
                // Log the count and display it in the result element
                console.log(`Count: ${countResult.length}`);
                const elapsed = document.getElementById('queryResult').textContent;
                document.getElementById('queryResult').textContent = `Count: ${countResult.length}\n${elapsed}`;
            } else {
                // If no allikas is included, clear the query and result elements
                document.getElementById('query').value = '';
                document.getElementById('queryResult').textContent = '';
            }
    
            // Clear the updateInterval when the query completes
            clearInterval(updateInterval);
    
            // Re-enable toggle buttons after the query completes
            document.querySelectorAll('.toggle').forEach((toggleButton) => {
                toggleButton.disabled = false;
            });
        });
    });
};

fetchAllikad()
