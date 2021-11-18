# radar-chart
Library to draw simple and sophisticated radar charts

```
// To use the library, include the following script tags in your page.
<script src="https://d3js.org/d3.v4.min.js"&gt;</script>
<script src="anandRadarChart.js"></script>

// To configure it, include a script tag like this.
<script>
// The config object is a JSON object.
var config =
{
	id: "radar",                     // id should match the div tag on the page.
	radius: 400,                     // required, the radius of the actual chart.
	title: "Countries of the World", // required
	legend: "right",                 // optional, values are right, left, top, bottom, none, default is right
	clockwise: false,                // optional, values are true/false, default false
	symmetric: false,                // optional, values are true/false, default false
	equidistant: false,              // optional, values are true/false, default false
	sections:                        // required, should contain at least one entry.
	[
		// id and name are required, colour is optional but strongly recommended, default is lightblue.
		{ id: "africa",     name: "Africa",     colour: "orange" },
		{ id: "americas",   name: "Americas",   colour: "lightgreen" },
		{ id: "asia",       name: "Asia",       colour: "#ff8888" },
		{ id: "europe",     name: "Europe",     colour: "#929244" },
		{ id: "oceania",    name: "Oceania",    colour: "lightblue" },
	],
	rings:                           // required, should contain at least one entry.
	[
		// id and name are required, colour is optional, default is a shade of grey.
		{ id: "rep",      name: "Republic" },
		{ id: "prov",     name: "Provisional" },
		{ id: "constmon", name: "Constitutional Monarchy" },
		{ id: "absmon",   name: "Absolute Monarchy" },
		{ id: "dict",     name: "Dictatorship", colour: "#bb22dd" },
	],
	entries:                         // required, should contain zero or more entries.
	[

// Simplest entry. section, ring and name are required. section and ring values should match the respective ids above.
{ section: 'americas', ring: 'rep', name: 'United States' },

// Most complex entry. Other than section, ring and name, everything else is optional and has sensible defaults.
{ section: 'asia', ring: 'rep', name: 'India', dr: '0.92822014024195', dt: '0.645', z: '11.057271246149', ds: '0.803366890307016', dc: '0.6', colour: 'lightblue' },
// dr is delta-radius, value should be [0,1], controls distance away from centre.
// dr is delta-angle, value should be [0,1], controls distance away from edge.
// z is z-value, value can be negative, controls height of bar.
// ds is delta-size, value should be [0,1], controls size of bar.
// dc is delta-colour, value should be [0,1], controls opacity of bar.
// colour is overriding colour, controls colour of bar.

	],
};
</script>

// To invoke the library with the config object above, add JavaScript:
<script>
	showRadar(config);
</script>

// To set up the radar, insert the div tag below into your page.
<div id="radar"><div>
```
