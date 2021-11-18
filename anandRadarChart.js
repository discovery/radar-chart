// The MIT License (MIT)

// Copyright (c) 2021 Discovery Communications Inc. & Anand Natrajan

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function showRadar(config)
{
	function moveTo(x, y)
	{
		return "translate(" + x + "," + y + ")";
	}

	function cartesian(polar)
	{
		return { x: polar.r * Math.cos(polar.t),
			y: (polar.o ? 1 : -1) * polar.r * Math.sin(polar.t) };
	}

	function polar(cartesian)
	{
		var x = cartesian.x;
		var y = (cartesian.o ? 1 : -1) * cartesian.y;
		return { t: Math.atan2(y, x), r: Math.sqrt(x * x + y * y) }
	}

	function rgb(r, g, b)
	{
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	var seed = Date.now();
	function random()
	{
		var x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	}

	// Find a number in between min and max. If only two arguments are
	// provided, it'll pick a random number in between, else the third
	// argument is intended to be a proportion.
	function between(min, max, prop)
	{
		return min + ((prop === undefined && random()) || prop) * (max - min);
	}

	// More configuration variables that we haven't exposed yet.
	var minRadius = 10;
	var maxRadius = 20;
	var textSize = "10px";
	var labelSize = "12px";
	var titleSize = "34px";
	var tiltFactor = 0.8;

	// Get some necessary variables used throughout.
	var numSections = config.sections.length;
	var numRings = config.rings.length;
	var numEntries = config.entries.length;
	var clockwise = config.clockwise || false;
	var symmetric = config.symmetric || false;
	var equidistant = config.equidistant || false;
	var totalRadius = 0.9 * config.radius;
	// Really, the valid values are L, T, B, R, N only.
	var legendPos = config.legend
		? config.legend.substring(0,1).toUpperCase() : "R";

	// Lay out the major elements depending on the legend position. Then
	// get references to the major items so we can work in peace.
	var div = d3.select("div#" + config.id)
		.append("table");
	var radar;
	var legend = null;
	var tr = div.append("tr");
	switch (legendPos)
	{
		case "N":
			radar = tr.append("td");
			break;
		case "L":
			legend = tr.append("td");
			radar = tr.append("td");
			break;
		case "T":
			legend = tr.append("td");
			tr = div.append("tr");
			radar = tr.append("td");
			break;
		case "B":
			radar = tr.append("td");
			tr = div.append("tr");
			legend = tr.append("td");
			break;
		case "R":
		default:
			radar = tr.append("td");
			legend = tr.append("td");
			break;
	}

	// Show the title for the page.
	legend && legend.attr("align", "center")
		.append("h1")
		.style("font-size", titleSize)
		.text(config.title);
	var padChart = 50;
	radar = radar.append("svg")
		.attr("width", (config.radius + padChart) * 2)
		.attr("height", (config.radius + padChart) * 2)
		.append("g")
		.attr("transform", moveTo(config.radius + padChart, config.radius + padChart));

	// Group the entries in some logical order, i.e., by sections, and
	// within that, by rings. Assign each entry a monotonically-increasing
	// id, for future reference. Also track a section id to number map.
	var allEntries = new Array(numSections);
	var sectionMap = [];
	var ringMap = [];
	for (var i = 0; i < numSections; i++)
	{
		allEntries[i] = new Array(numRings);
		for (var j = 0; j < numRings; j++)
			allEntries[i][j] = [];
		sectionMap[config.sections[i].id] = i;
	}
	for (var i = 0; i < numRings; i++)
		ringMap[config.rings[i].id] = i;
	for (var i = 0; i < numEntries; i++)
	{
		var entry = config.entries[i];
		entry.id = entry.id || ("" + (i + 1));
		allEntries[sectionMap[entry.section]][ringMap[entry.ring]].push(entry);
	}

	// Check if we want equidistant ring sizes or not. If not equidistant,
	// the innermost one should be the largest proportionally. Make the
	// increments smaller and smaller as we go outwards.
	var radiusMap = [];
	radiusMap[-1] = 10; // deal with edge cases
	var ringBase = totalRadius / numRings;
	if (equidistant)
		for (var i = 0; i < numRings; i++)
			radiusMap[i] = Math.round((i+1) * ringBase);
	else
		for (var i = 0; i < numRings; i++)
			radiusMap[i] = Math.round(Math.sqrt((i+1) / numRings) * totalRadius);

	// Check if we want symmetric or asymmetric section sizes. If
	// asymmetric, it should be proportional to the number of entries in
	// the innermost ring, which is densest.
	var angleMap = [];
	angleMap[-1] = 0; // deal with edge cases
	if (symmetric)
	{
		var sectionAngle = 2 * Math.PI / numSections;
		for (var i = 0; i < numSections; i++)
			angleMap[i] = (i + 1) * sectionAngle;
	}
	else
	{
		// All right, we want asymmetric. Count up total entries in
		// innermost ring for all sections, but add 1 to each entry count
		// so that we never have a zero-sized section.
		var numInnermostEntries = 0;
		for (var i = 0; i < numSections; i++)
			numInnermostEntries += allEntries[i][0].length + 1;
		var sectionAngle = 2 * Math.PI / numInnermostEntries;
		for (var i = 0; i < numSections; i++)
			angleMap[i] = angleMap[i-1] + (allEntries[i][0].length + 1) * sectionAngle;
	}
	angleMap[numSections] = 2 * Math.PI; // deal with edge cases

	// Compute the positions right now itself. We can then sort on them.
	var padAngle = 0.01; // radians, magic number
	config.entries.forEach((entry) =>
	{
		var mySection = sectionMap[entry.section];
		var myRing = ringMap[entry.ring];
		var myRadius = between(radiusMap[myRing - 1] + minRadius,
			radiusMap[myRing] - minRadius, entry.dr);
		var myAngle = between(angleMap[mySection - 1] + padAngle,
			angleMap[mySection] - padAngle, entry.dt);
		var position = cartesian
		({
			r: myRadius,
			t: myAngle,
			o: clockwise
		});
		// Save the positions in the entry, for later use.
		entry.x = position.x;
		entry.y = position.y;
		entry.z = entry.z || 0;
		entry.r = (entry.ds === undefined)
			? minRadius : Math.sqrt(minRadius ** 2
				+ entry.ds * (maxRadius ** 2 - minRadius ** 2))
	});

	// And... now we sort so as to draw "back to front".
	config.entries.sort((e1, e2) => e1.y - e2.y);

	// Draw the rings. We'll choose progressively darker shades for larger
	// rings. Also, the text for the rings has to be an even darker hue.
	var minGrey = 200;
	var maxGrey = 255;
	var hueIncr = (maxGrey - minGrey) / numRings;
	var labelColour = minGrey - hueIncr * 5;
	var labelDisp = ringBase / 4;
	for (var i = numRings; --i >= 0; )
	{
		if (config.rings[i].colour === undefined)
		{
			var circleColour = maxGrey - i * hueIncr;
			config.rings[i].colour = rgb(circleColour, circleColour, circleColour);
		}
		radar.append("circle")
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("r", radiusMap[i])
			.style("fill", config.rings[i].colour)
			.style("stroke", "black")
			.style("stroke-width", 1);
		radar.append("text")
			.text(config.rings[i].name)
			.attr("y", radiusMap[i] - labelDisp)
			.attr("text-anchor", "middle")
			.style("fill", rgb(labelColour, labelColour, labelColour))
			.style("font-size", labelSize)
			.style("font-weight", "bold")
			.style("pointer-events", "none")
			.style("user-select", "none");
	}

	// Draw the sections. That's simply drawing radial lines on the rings.
	// Put the labels for the sections just outside the sections, and
	// shown in the appropriate section colour.
	for (var i = 0; i < numSections; i++)
	{
		if (config.sections[i].colour === undefined)
			config.sections[i].colour = "lightblue";
		var section = cartesian
		({
			r: radiusMap[numRings - 1],
			t: angleMap[i],
			o: clockwise
		});
		var label = cartesian
		({
			r: totalRadius * 1.1,
			t: (angleMap[i] + angleMap[i-1]) / 2,
			o: clockwise
		});
		radar.append("line")
			.attr("x1", 0).attr("y1", 0)
			.attr("x2", section.x).attr("y2", section.y)
			.style("stroke", rgb(labelColour, labelColour, labelColour))
			.style("stroke-width", 1);
		radar.append("text")
			.text(config.sections[i].name)
			.attr("x", label.x).attr("y", label.y)
			.attr("text-anchor", "middle")
			.style("fill", config.sections[i].colour)
			.style("font-size", labelSize)
			.style("font-weight", "bold")
			.style("pointer-events", "none")
			.style("user-select", "none");
	}

	// Draw each entry in the order originally given. To draw each entry,
	// we find the correct section for it, and within that, the correct
	// ring. We then randomly place a circle for the entry within that
	// section, with some padding so it doesn't touch the borders too much.
	config.entries.forEach((entry) =>
	{
		var mySection = sectionMap[entry.section];
		// Get the colour and opacity for the entry.
		var myColour = entry.colour || config.sections[mySection].colour;
		var myOpacity = (entry.dc === undefined && 1) || entry.dc;
		var myId = entry.id;
		column = radar.append("g")
			.style("fill", myColour)
			.style("opacity", myOpacity)
			.style("stroke", "black")
			.style("stroke-width", 1);
		// Do we need a column? Yes, if we have a height.
		if (entry.z != 0) // strictly non-zero-height column.
		{
			// Draw the base of the column.
			var towerBase = column.append("g");
			towerBase.append("ellipse")
				.attr("cx", entry.x)
				.attr("cy", entry.y - Math.min(entry.z, 0))
				.attr("rx", entry.r)
				.attr("ry", entry.r * tiltFactor);
			// Draw the tower of the column.
			towerBase.append("rect")
				.attr("x", entry.x - entry.r)
				.attr("y", entry.y - Math.max(entry.z, 0))
				.attr("width", 2 * entry.r)
				.attr("height", Math.abs(entry.z));
			if (entry.z < 0) // if it's negative-height show differently.
				towerBase.style("opacity", myOpacity/2)
					.style("stroke-dasharray", "2 2");
			// Erase the annoying base of the rectangle.
			column.append("line")
				.attr("x1", entry.x - entry.r + 1)
				.attr("y1", entry.y - Math.min(entry.z, 0))
				.attr("x2", entry.x + entry.r - 1)
				.attr("y2", entry.y - Math.min(entry.z, 0))
				.style("stroke", myColour)
				.style("stroke-width", 2);
		}
		// Draw the very top of the column.
		column.append("ellipse")
			.attr("id", "bubble-" + myId)
				.on("mouseover", function() { toggleBubble(entry, true); toggleLegend(entry, true); })
				.on("mouseout", function() { toggleBubble(entry, false); toggleLegend(entry, false); })
			.attr("cx", entry.x)
			.attr("cy", entry.y - Math.max(entry.z, 0))
			.attr("rx", entry.r)
			.attr("ry", entry.r * tiltFactor);
		// Label the top of the column.
		column.append("text")
			.text("" + myId)
			.attr("x", entry.x)
			.attr("y", entry.y - Math.max(entry.z, 0))
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.style("font-size", textSize)
			.style("pointer-events", "none")
			.style("user-select", "none");
	});

	// Show the legend as a table on the right of the chart.
	if (legend)
	{
	var tbl = legend.append("table");
	tbl.append("th");
	// Show column headings first, colour-coordinated with the rings.
	for (var ring = 0; ring < numRings; ring++)
	{
		tbl.append("th")
			.attr("width", "" + Math.round(100 / (numRings + 1)) + "%")
			.style("background-color", config.rings[ring].colour)
			.style("color", rgb(labelColour, labelColour, labelColour))
			.text(config.rings[ring].name)
			.style("font-size", labelSize)
			.style("font-weight", "bold")
			.style("pointer-events", "none")
			.style("user-select", "none");
	}
	// Show each section as a row, with a subtle separator in the section
	// colour. Make each entry have a tooltip with the corresponding circle.
	for (var section = 0; section < numSections; section++)
	{
		var rowColour = config.sections[section].colour;
		tbl.append("tr")
			.style("background-color", rowColour)
			.style("vertical-align", "top")
			.append("td")
			.attr("colspan", numRings+1)
			.text("");
		var currRow = tbl.append("tr")
			.style("vertical-align", "top");
		currRow.append("td")
			.text(config.sections[section].name)
			.style("font-size", labelSize)
			.style("font-weight", "bold");
		for (var ring = 0; ring < numRings; ring++)
		{
			var currCol = currRow.append("td")
				.style("font-size", textSize);
			allEntries[section][ring].forEach((entry) =>
			{
				currCol.append("text")
					.attr("id", "legend-" + entry.id)
					.text(entry.id + ". " + entry.name)
					.on("mouseover", function() { toggleBubble(entry, true); toggleLegend(entry, true); })
					.on("mouseout", function() { toggleBubble(entry, false); toggleLegend(entry, false); })
					.append("br");
			});
		}
	}
	}

	// Tooltip bubble. Draw it once and hide it, so we can reuse it every
	// single time we need it. Heavily inspired by Zalando code.
	var bubble = radar.append("g")
		.attr("id", "bubble")
		.attr("x", 0)
		.attr("y", 0)
		.style("opacity", 0)
		.style("pointer-events", "none")
		.style("user-select", "none");
	bubble.append("rect")
		.attr("rx", 4)
		.attr("ry", 4)
		.style("fill", "#030303");
	bubble.append("text")
		.style("font-size", textSize)
		.style("fill", "white");
	bubble.append("path")
		.attr("d", "M 0,0 10,0 5,8 z")
		.style("fill", "#030303");

	function toggleBubble(entry, isOn)
	{
		if (isOn)
		{
			var tooltip = d3.select("#bubble text")
				.text(entry.name);
			var bbox = tooltip.node().getBBox();
			// If it's a negative column, we don't want to factor its
			// height when we show the bubble.
			d3.select("#bubble")
				.attr("transform", moveTo(entry.x - bbox.width / 2,
					entry.y - Math.max(0, entry.z) - 16))
				.style("opacity", 0.8);
			d3.select("#bubble rect")
				.attr("x", -5)
				.attr("y", -bbox.height)
				.attr("width", bbox.width + 10)
				.attr("height", bbox.height + 4);
			d3.select("#bubble path")
				.attr("transform", moveTo(bbox.width / 2 - 5, 3));
		}
		else
		{
			var bubble = d3.select("#bubble")
				.attr("transform", moveTo(0, 0))
				.style("opacity", 0);
		}
	}

	function toggleLegend(entry, isOn)
	{
		var item = document.getElementById("legend-" + entry.id);
		if (isOn)
			item && item.setAttribute("style", "background-color: black; color: white;");
		else
			item && item.removeAttribute("style");
	}
}
