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

    // Clear previous result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    // Create radio controls for each row
    allikadResult.forEach((row, index) => {
        const rowDiv = document.createElement('li');
        rowDiv.classList.add('row');

        // Display the value of "allikas" as a label
        const label = document.createElement('label');
        label.textContent = row.allikas;
        rowDiv.appendChild(label);

        // Create radio buttons for "off", "N/A", and "on"
        ['off', 'N/A', 'on'].forEach((value) => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `row-${index}`;
            radio.value = value;
            if (value === 'N/A') {
                radio.checked = true; // Set "N/A" as default checked
            }
            rowDiv.appendChild(radio);

            const buttonLabel = document.createElement('label');
            buttonLabel.textContent = value;
            rowDiv.appendChild(buttonLabel);
        });

        // Add rowDiv to the resultDiv
        resultDiv.appendChild(rowDiv);
    });
};
fetchAllikad()
document.getElementById('queryForm').dispatchEvent(new Event('submit'));

    // const query = document.getElementById('query').value;
    // const response = await fetch('/query', { ...options, body: JSON.stringify({ query: query }) });
