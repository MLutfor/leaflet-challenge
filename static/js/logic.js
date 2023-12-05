document.addEventListener('DOMContentLoaded', function () {
  // Create a Leaflet map centered at a specific location
  const map = L.map('map').setView([0, 0], 2);

  // Add the base tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add scale bar to the map and position it on the bottom-left corner
  L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 200 }).addTo(map);
  const scaleElement = document.querySelector('.leaflet-control-scale');
  const scaleTitle = document.createElement('div');
  scaleTitle.className = 'leaflet-control-scale-line';
  scaleTitle.innerHTML = 'Scale';
  scaleElement.insertBefore(scaleTitle, scaleElement.firstChild);

  // Define a function to get color based on earthquake depth
  function getColor(d) {
    return d > 90 ? 'darkred' :
           d > 70 ? 'red' :
           d > 50 ? 'orange' :
           d > 30 ? 'yellow' :
           d > 10 ? 'green' :
                    'lightgreen';
  }

  // Fetch earthquake data from the provided URL
  fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson')
    .then(response => response.json())
    .then(data => {

      // Iterate through earthquake data and create markers
      data.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const magnitude = feature.properties.mag;
        const depth = coordinates[2];

        // Define marker options based on magnitude and depth
        const maxMarkerSize = 30; // Set your maximum marker size here
        const markerRadius = Math.min(Math.pow(2, magnitude) * 2, maxMarkerSize); // Limit marker size

        const markerOptions = {
          radius: markerRadius,
          color: 'black',
          fillColor: getColor(depth),
          fillOpacity: 0.8,
        };

        // Create a marker and add it to the map
        const marker = L.circleMarker([coordinates[1], coordinates[0]], markerOptions).addTo(map);

        // Create a popup with earthquake information
        const popupContent = `
          <b>Magnitude:</b> ${magnitude}<br>
          <b>Depth:</b> ${depth} km<br>
          <b>Location:</b> ${feature.properties.place}<br>
          <a href="${feature.properties.url}" target="_blank">USGS Event Page</a>
        `;

        // Find nearby earthquakes within a 100 km radius for each marker
        const nearbyEarthquakes = data.features.filter(e => {
          const dist = map.distance(
            [coordinates[1], coordinates[0]],
            [e.geometry.coordinates[1], e.geometry.coordinates[0]]
          );
          return dist <= 100000 && e.properties.place !== feature.properties.place;
        });

        // Display nearby earthquakes information in the popup
        if (nearbyEarthquakes.length > 0) {
          const nearbyQuakesContent = nearbyEarthquakes.map(quake => {
            return `
              <b>Nearby Earthquake:</b><br>
              <b>Magnitude:</b> ${quake.properties.mag}<br>
              <b>Depth:</b> ${quake.geometry.coordinates[2]} km<br>
              <b>Location:</b> ${quake.properties.place}<br>
              <a href="${quake.properties.url}" target="_blank">USGS Event Page</a><br><br>
            `;
          }).join('');

          const combinedPopupContent = popupContent + nearbyQuakesContent;
          marker.bindPopup(combinedPopupContent);
        } else {
          marker.bindPopup(popupContent);
        }
      });
    });

  // Create a legend to explain the earthquake depth color scale
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.style.backgroundColor = 'white'; // Set the legend background color to white
    div.innerHTML = '<h4>Depth by km</h4>'; // Title for the legend
    const labels = ['-10 to 10', '10 to 30', '30 to 50', '50 to 70', '70 to 90', '90+'];
    const colors = ['lightgreen', 'green', 'yellow', 'orange', 'red', 'darkred'];

    for (let i = 0; i < colors.length; i++) {
      div.innerHTML += `
        <span style="background:${colors[i]}; width: 20px; height: 10px; display: inline-block;"></span> ${labels[i]}<br>`;
    }

    return div;
  };

  legend.addTo(map);
});
