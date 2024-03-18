// script.js
const COUNT_QUERY_TEMPLATE =
`
    SELECT DISTINCT k.persoon
    FROM repis.kirjed k
    LEFT JOIN (
        SELECT DISTINCT persoon
        FROM repis.kirjed
        WHERE allikas IN (%s)
    ) ex ON k.persoon = ex.persoon
    WHERE k.allikas IN (%s)
    AND k.persoon <> '0000000000'
    AND ex.persoon IS NULL
`

const AND_QUERY_TEMPLATE =
`
    GROUP BY k.persoon
    HAVING COUNT(DISTINCT k.allikas) = %s
`

const DISPLAY_QUERY_TEMPLATE =
`SELECT * FROM repis.kirjed WHERE persoon IN (%s);`

const sprintf = (template, ...args) => {
    return template.replace(/%s/g, () => args.shift());
}

const queryResultElement = document.getElementById('queryResult');
const resultQueryElement = document.getElementById('resultQuery');

const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: ''
};

const switchToggle = async (e) => {
    // Prevent clicking on already selected buttons
    if (e.target.hasAttribute('checked')) {
        return;
    }

    // Disable all toggle buttons while the query runs
    document.querySelectorAll('.toggle').forEach((toggleButton) => {
        toggleButton.disabled = true;
    });
    // Disable the AND/OR buttons while the query runs
    document.querySelectorAll("#andOrToggle > button").forEach((toggleButton) => {
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
        await performQuery(includedAllikas, excludedAllikas);
    } else {
        // If no allikas is included, clear the query and result elements
        resultQueryElement.textContent = '';
        queryResultElement.textContent = '';
    }

    // Clear the updateInterval when the query completes
    clearInterval(updateInterval);

    // Re-enable toggle buttons after the query completes
    document.querySelectorAll('.toggle').forEach((toggleButton) => {
        toggleButton.disabled = false;
    });

    // Re-enable the AND/OR buttons after the query completes, if more than one allikas is included
    if (includedAllikas.length > 1) {
        document.querySelectorAll("#andOrToggle > button").forEach((toggleButton) => {
            toggleButton.disabled = false;
        });
    }
};

const fetchTotalCount = async () => {
    // Count distinct 'persoon' values in the 'kirjed' table
    const totalCountQuery = 'SELECT COUNT(DISTINCT persoon) as count FROM repis.kirjed WHERE persoon <> \'0000000000\';';
    const totalCountResponse = await fetch('/query', { ...options, body: JSON.stringify({ query: totalCountQuery }) });
    const totalCountResult = await totalCountResponse.json();
    console.log(`Total Count: ${totalCountResult[0].count}`);
    document.getElementById('totalCount').textContent = `Total Count: ${totalCountResult[0].count}`;
}

const fetchAllikad = async () => {
    
    const allikadQuery = 'select kood, allikas from allikad where isFilter = 1 order by allikas';

    const allikadResponse = await fetch('/query', { ...options, body: JSON.stringify({ query: allikadQuery }) });

    const allikadResult = await allikadResponse.json();

    const filtersDiv = document.getElementById('filters');

    const switchLabels = {'off': 'x', 'na': '.', 'on': 'v'}
    // Create toggle controls for each row
    allikadResult.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('filtersRow');
        const toggleSwitchDiv = document.createElement('div');
        toggleSwitchDiv.classList.add('toggle-switch');

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
            rowDiv.appendChild(toggleSwitchDiv);
            toggleSwitchDiv.appendChild(toggleInput);
        });

        // Display the value of "allikas" as a label
        const allikas = document.createElement('div');
        allikas.textContent = row.allikas;
        allikas.classList.add('allikas');
        rowDiv.appendChild(allikas);

        // Add rowDiv to the filtersDiv
        filtersDiv.appendChild(rowDiv);
    });

    document.querySelectorAll('.toggle').forEach((toggleLabel) => {
        toggleLabel.addEventListener('click', switchToggle);
    });
};

const highlightSQL = (sql) => {
    return sql.replace(/(SELECT|FROM|LEFT JOIN|WHERE|AND|OR|IN|ON|DISTINCT|IS NULL|IS NOT NULL|HAVING|GROUP BY)/g, '<span class="sql-keyword">$1</span>');
};

// Add listeners to 'andOrToggle' buttons
const andButton = document.getElementById('andQuery')
andButton.setAttribute('checked', 'true');
andButton.disabled = true;
andButton.addEventListener('click', switchToggle);
const orButton = document.getElementById('orQuery')
orButton.addEventListener('click', switchToggle);
orButton.disabled = true;

// Fetch the total count and allikad
fetchTotalCount()
fetchAllikad()

async function performQuery(includedAllikas, excludedAllikas) {
    const includedAllikasTerm = includedAllikas.map(row => `'${row}'`).join(',');
    const excludedAllikasTerm = excludedAllikas.map(row => `'${row}'`).join(',');
    let countQuery = sprintf(COUNT_QUERY_TEMPLATE, excludedAllikasTerm, includedAllikasTerm);

    // Add the AND_QUERY_TEMPLATE if more than one allikas is included
    // and 'AND/OR' is switched to 'AND'
    if (includedAllikas.length > 1 && document.getElementById('andQuery').getAttribute('checked') === 'true') {
        countQuery += sprintf(AND_QUERY_TEMPLATE, includedAllikas.length);
    }

    // Set the query value to the textarea
    const displayQuery = sprintf(DISPLAY_QUERY_TEMPLATE, countQuery);
    resultQueryElement.innerHTML = highlightSQL(displayQuery);

    // Fetch and process the count result
    const countResponse = await fetch('/query', { ...options, body: JSON.stringify({ query: countQuery }) });
    const countResult = await countResponse.json();

    // Log the count and display it in the result element
    console.log(`Count: ${countResult.length}`);
    const elapsed = queryResultElement.textContent;
    queryResultElement.textContent = `Count: ${countResult.length}\n${elapsed}`;
}

