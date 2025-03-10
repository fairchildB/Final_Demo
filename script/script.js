// Create the map and center on Oregon
var map = L.map('map').setView([44.0, -120.5], 7);

// Add a tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/breezy69/cm7z3rhps000k01sl35a94x3r/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJlZXp5NjkiLCJhIjoiY2xvaXlwMWxpMHB2cjJxcHFyeTMwNzk0NCJ9.R18DLRCA9p_SNX-6dtZZZg', {
    attribution: '&copy; <a href="https://www.mapbox.com">Mapbox</a>'
}).addTo(map);

// Initialize an empty layers object
var layers = {};

// URLs of the GeoJSON files (excluding Building Footprints)
var geojsonUrls = [
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/SM.geojson?v=1741035058274",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/M.geojson?v=1741035069680",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/L.geojson?v=1741035081255",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/XL.geojson?v=1741035092153",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/XXL.geojson?v=1741035102948"
];

// Define the correct order for the layer names
var layerNames = ['Small', 'Medium', 'Large', 'Extra-Large', 'Extra-Extra-Large'];

// Scenario data
var scenarioData = {
    'Small': { population: 19033, buildings: 12385 },
    'Medium': { population: 28192, buildings: 22590 },
    'Large': { population: 39755, buildings: 33918 },
    'Extra-Large': { population: 57095, buildings: 50267 },
    'Extra-Extra-Large': { population: 127723, buildings: 53941 }
};

// Initialize Chart.js with default "Small" scenario data
var ctx = document.getElementById('populationChart').getContext('2d');
var populationChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Population', 'Number of Buildings'],
        datasets: [
            {
                label: 'Small',
                data: [scenarioData['Small'].population, scenarioData['Small'].buildings],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }
        ]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Function to update chart data
function updateChartData(label) {
    var populationValue = scenarioData[label].population;
    var buildingsValue = scenarioData[label].buildings;
    populationChart.data.datasets[0].label = label;
    populationChart.data.datasets[0].data = [populationValue, buildingsValue];
    populationChart.update();
    document.getElementById('scenarioName').innerText = label;
}

function createRadioButton(name, layer) {
    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'layerControl';
    radio.value = name;
    radio.onclick = function() {
        for (var key in layers) {
            if (layers[key] && key !== 'Choropleth' && key !== 'CityLimits') {
                map.removeLayer(layers[key]);
            }
        }
        layer.addTo(map);
        updateChartData(name);
        
        // Ensure City Limits layer stays on the map
        if (cityLimitsCheckbox.checked) {
            layers['CityLimits'].addTo(map);
        }
    };
    return radio;
}

// Create a layer control div and add it to the top right of the map
var layerControlDiv = document.createElement('div');
layerControlDiv.className = 'layer-control';
map.getContainer().appendChild(layerControlDiv);

// Create a layer selection div and add it below the layer control div
var layerSelectionDiv = document.createElement('div');
layerSelectionDiv.id = 'layerSelectionDiv';
map.getContainer().appendChild(layerSelectionDiv);

// Add a checkbox for the choropleth layer
var choroplethCheckbox = document.createElement('input');
choroplethCheckbox.type = 'checkbox';
choroplethCheckbox.id = 'choroplethCheckbox';
choroplethCheckbox.onchange = function() {
    if (choroplethCheckbox.checked) {
        addChoroplethLayer();
    } else {
        removeChoroplethLayer();
    }
};
var choroplethLabel = document.createElement('label');
choroplethLabel.htmlFor = 'choroplethCheckbox';
choroplethLabel.textContent = 'Show Census Blocks (Choropleth)';
layerSelectionDiv.appendChild(choroplethCheckbox);
layerSelectionDiv.appendChild(choroplethLabel);

// Function to get color for choropleth based on population
function getChoroplethColor(d) {
    return d > 500 ? '#800026' :
           d > 400 ? '#BD0026' :
           d > 300 ? '#E31A1C' :
           d > 200 ? '#FC4E2A' :
           d > 100 ? '#FD8D3C' :
           d > 50  ? '#FEB24C' :
           d > 20  ? '#FED976' :
                      '#FFEDA0';
}

// Function to add choropleth layer
function addChoroplethLayer() {
    fetch('https://cdn.glitch.me/ecc24017-de3b-4e2a-bfc9-fbbd2940efe6/CensusBlocks_E_FeaturesToJSO.geojson?v=1741221960959')
        .then(response => response.json())
        .then(data => {
            var choroplethLayer = L.geoJSON(data, {
                style: function(feature) {
                    var population = feature.properties.POP20;
                    return {
                        fillColor: getChoroplethColor(population),
                        weight: 1,
                        color: 'black',
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.POP20) {
                        layer.bindPopup('Population: ' + feature.properties.POP20);
                    }
                }
            }).addTo(map);

            layers['Choropleth'] = choroplethLayer;
            legend.getContainer().style.display = 'block'; // Show the legend
        });
}

// Function to remove choropleth layer
function removeChoroplethLayer() {
    if (layers['Choropleth']) {
        map.removeLayer(layers['Choropleth']);
        delete layers['Choropleth'];
        legend.getContainer().style.display = 'none'; // Hide the legend
    }
}

// Create a div for the legend and set its initial display to 'none'
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.style.display = 'none'; // Initially hide the legend

    // Add title to the legend
    var title = document.createElement('h4');
    title.textContent = 'Total Population';
    div.appendChild(title);

    // Define the labels for the legend based on the population ranges
    var grades = [0, 100, 200, 300, 400];
    var labels = [];

    // Loop through the grades and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getChoroplethColor(grades[i] + 1) + '; width: 18px; height: 18px; display: inline-block; margin-right: 5px;"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    // Apply styles to the div for the background and border
    div.style.backgroundColor = 'white';
    div.style.border = '2px solid black';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';

    return div;
};


legend.addTo(map);

// Function to fetch data and add layers in the correct order
function fetchData(url, index) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            var layerName = layerNames[index];
            var layer = L.geoJSON(data, { style: { color: 'blue' } });
            layers[layerName] = layer;

            var radio = createRadioButton(layerName, layer);
            var label = document.createElement('label');
            label.textContent = layerName;
            label.insertBefore(radio, label.firstChild);
            layerControlDiv.appendChild(label);

            // Automatically select the first layer (Small scenario)
            if (index === 0) {
                radio.checked = true;
                layer.addTo(map);
                updateChartData(layerName);
            }

            // Fetch the next GeoJSON file if there's any
            if (index + 1 < geojsonUrls.length) {
                fetchData(geojsonUrls[index + 1], index + 1);
            }
        });
}

// Add a checkbox for the city limits layer
var cityLimitsCheckbox = document.createElement('input');
cityLimitsCheckbox.type = 'checkbox';
cityLimitsCheckbox.id = 'cityLimitsCheckbox';
cityLimitsCheckbox.onchange = function() {
    if (cityLimitsCheckbox.checked) {
        addCityLimitsLayer();
    } else {
        removeCityLimitsLayer();
    }
};
var cityLimitsLabel = document.createElement('label');
cityLimitsLabel.htmlFor = 'cityLimitsCheckbox';
cityLimitsLabel.textContent = 'Show City Limits';
layerSelectionDiv.appendChild(cityLimitsCheckbox);
layerSelectionDiv.appendChild(cityLimitsLabel);

// Add a small legend box next to the label
var cityLimitsLegend = document.createElement('div');
cityLimitsLegend.className = 'city-limits-legend';
layerSelectionDiv.appendChild(cityLimitsLegend);


// Function to add city limits layer with black border
function addCityLimitsLayer() {
    fetch('https://cdn.glitch.global/3fcb409a-ac4a-46a6-aa0a-b70234ef9800/City_Limits_Ex_FeaturesToJSO.geojson?v=1741487353166')
        .then(response => response.json())
        .then(data => {
            var cityLimitsLayer = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        color: 'black', // Set border color to black
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.3,
                        fillColor: 'grey' // Set fill color to grey
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.Name) {
                        layer.bindPopup('City Name: ' + feature.properties.Name);
                    }
                }
            }).addTo(map);

            layers['CityLimits'] = cityLimitsLayer;
        });
}


// Function to remove city limits layer
function removeCityLimitsLayer() {
    if (layers['CityLimits']) {
        map.removeLayer(layers['CityLimits']);
        delete layers['CityLimits'];
    }
}


// Start fetching data sequentially from the first URL
fetchData(geojsonUrls[0], 0);

