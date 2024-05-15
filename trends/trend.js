const slider = document.getElementById('year');
const output = document.getElementById('updates');
const dataFrequencySelector = document.getElementById('data-frequency');
const regionSelector = document.getElementById("region")
const propotionSelector = document.getElementById('absolute_vals');
console.log(propotionSelector.checked)

output.innerHTML = `Displaying ${dataFrequencySelector.value} trend for the year ${slider.value}`; // Display the default slider value

function loadData() {
    const year = parseInt(slider.value);
    const frequency = dataFrequencySelector.value;
    const region = regionSelector.value
    const useProportions = document.getElementById('absolute_vals').checked;

    dataSource = frequency === 'weekly' ? 'trend_weekly.json' : 'trend_monthly.json';
    console.log(`year ${year}, frequency ${frequency} , region ${region} proportion: ${useProportions}`)

    d3.json(dataSource).then(function (data) {

        const filteredData = data.filter(d => d.year === year);
        const regionData = filteredData.filter(d => d.area === region)
        const uniqueTypes = Array.from(d3.group(filteredData, d => d.type).keys());
        console.log(regionData);

        console.log(uniqueTypes);
        drawCharts(regionData, year, frequency, uniqueTypes, useProportions);
    });

}

// Update the chart when the toggle between abasolute and relative value changes
propotionSelector.addEventListener('change', loadData)

// Update the chart when the data frequency changes
dataFrequencySelector.addEventListener('change', loadData);
regionSelector.addEventListener("input", loadData);

// Update the chart when the year changes
slider.addEventListener('input', function () {
    output.innerHTML = `Displaying ${dataFrequencySelector.value} trend for the year ${this.value}`; // Display the default slider value;  // Update the displayed year
    loadData();  // Load the data with the new year
});

// Initial data load
loadData();

function getData() {
    const year = parseInt(slider.value);
    const frequency = dataFrequencySelector.value;
    const region = document.getElementById('region').value;
    const useProportions = document.getElementById('absolute_vals').checked;

    // Correct assignment of dataSource for both scenarios
    dataSource = frequency === 'weekly' ? 'trend_weekly.json' : 'trend_monthly.json';
    d3.json(dataSource).then(function (data) {
        console.log("Using dataSource:", dataSource);
        let filteredData = data.filter(d => d.year === year);
        filteredData = data.filter(d => d.area === region);

        // Simplify the extraction of unique types using new Set and map
        const uniqueTypes = Array.from(new Set(filteredData.map(d => d.type)));

        console.log("Filtered Data:", filteredData);
        console.log("Unique Types:", uniqueTypes);
        drawCharts(filteredData, year, frequency, uniqueTypes, useProportions);
    }).catch(error => {
        console.error('Error loading or processing data:', error);
    });

}

function drawCharts(data, year, frequency, types, proportion) {

    const filteredData = data.filter(d => d.year === parseInt(year));
    const businessUnits = d3.groups(filteredData, d => d.business_unit);
    const totalRevenue = d3.sum(filteredData, d => d.revenue);

    // Clear previous charts
    const chartContainer = d3.select("#chart");
    chartContainer.html(''); // Clear previous charts

    // Append a div for each business unit chart to manage with flexbox
    businessUnits.forEach(([unit, unitData], index) => {
        const OvearallRevenue = d3.min(unitData, d => d.total);

        const container = chartContainer.append("div")
            .attr("class", "chart-item container-fluid")
            .style("flex", "1")
            .style("min-width", "600px"); // Ensure each chart has enough space

        // Append SVG to the newly created div
        const svg = container.append("svg")
            .attr("width", 600)
            .attr("height", 600)
            .append("g")
            .attr("transform", `translate(300, 300)`); // Center the radial chart

        // 
        const scaleRadius = (OvearallRevenue / totalRevenue * 100) * 2; // Scale proportionally

        // Now pass the SVG, data, title, year, and total revenue to create the radial chart

        if (frequency === "weekly") {

            if (proportion) {
                createRadialCharRelative(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types);
            } else {
                createRadialChart(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types);

            }

        } else {

            if (proportion) {
                createRadialChartMonthRelative(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types);
            } else {
                createRadialChartMonth(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types);

            }
        }
    });

    const legendHeight = 50; // Adjust this value as needed to leave space for the legend

    const color = d3.scaleOrdinal()
        .domain(types)
        .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);

    const chartDiv = chartContainer.append("div")
        .style("position", "absolute")
        .style("bottom", "0")
        .style("width", "100%")
        .style("height", `${legendHeight}px`);

    // Append charts to the chartDiv
    chartDiv.selectAll("div.chart")
        .data(types)
        .join("div")
        .attr("class", "chart")
        .style("display", "inline-block") // Display divs inline
        .call(g => g.append("div")
            .style("width", "15px")
            .style("height", "18px")
            .style("background-color", d => color(d))) // Use the data (d) to determine the color
        .call(g => g.append("span")
            .style("margin-left", "5px")
            .text(d => d));
}

function createRadialChart(svg, data, title, totalRevenue, scaleRadius, types) {

    ////////////////////////////////////////////////////////////////////////////////

    const years = Array.from({ length: 5 }, (_, i) => 2019 + i); // Years 2019 to 2023
    const areas = ["Overall", "North", "South", "West", "East", "Underdark"];
    const business_units = ["Adventuring", "Commissions", "Luxury specialities"];
    const data2 = [];
    years.forEach(year => {
        for (let week = 1; week <= 52; week++) {
            areas.forEach(area => {
                business_units.forEach(business_unit => {
                    const total_customers = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
                    const entry = {
                        "year": year,
                        "week": week,
                        "area": area,
                        "business_unit": business_unit,
                        "totalCustomers": total_customers
                    };
                    data2.push(entry);
                });
            });
        }
    });
    const filteredData2 = data2.filter(d => d.year === 2019);

    //////////////////////////////////////////////////////////////////////////////////

    const width = 450, height = 550;
    const innerRadius = 150, outerRadius = Math.min(width + scaleRadius, height) / 2;
    const year = d3.select("#year").property("value");

    // Setup scales and arcs
    const x = d3.scaleBand()
        .domain(data.map(d => d.week))
        .range([0, 2 * Math.PI])
        .align(0);
    const g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    const y = d3.scaleRadial()
        .domain([0, d3.max(data, d => d.revenue)])
        .range([innerRadius, outerRadius]);

    const arc = d3.arc()
        .innerRadius(d => y(0))
        .outerRadius(d => y(d.revenue * 1.25))
        .startAngle(d => x(d.week))
        .endAngle(d => x(d.week) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(types)
        .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);

    // Draw arcs
    svg.selectAll(".arc")
        .data(data)
        .enter().append("path")
        .attr("class", "arc")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    ////////////////////////////////////////////////////////////////////////////////
    const innerArea = d3.areaRadial()
        .innerRadius(d => y(d.totalCustomers)) // Adjust as needed
        .outerRadius(d => y(d.totalCustomers) / 2)
        .startAngle(d => x(d.week))
        .endAngle(d => x(d.week) + x.bandwidth());

    svg.selectAll(".innerArea")
        .data(filteredData2)
        .enter().append("path")
        .attr("class", "innerArea")
        .attr("fill", d => color(d.type))
        .attr("d", innerArea);
    /*    
     // Draw inner areas
     g.append("path")
         .datum(data)
         .attr("fill", "steelblue") // Adjust color as needed
         .attr("d", innerArea)
         .attr("transform", "translate(" + -width / 2 + "," + -height / 2 + ")");;
 */
    ////////////////////////////////////////////////////////////////////////////////
    // Add title
    svg.append("text")
        .attr("x", 110)
        .attr('class', 'legend')
        .attr("y", -outerRadius - 16)
        .attr("text-anchor", "middle")
        .text(`${title} - ${year}`);

    svg.append("g")
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
        )
        .call(g => g.selectAll("g")
            .data(y.ticks(5).slice(1))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.3)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));

    // Add info on total revenue
    svg.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text(`${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);

    // add x axis tick marks
    const monthMapping = {
        1: "January",
        13: "March",
        27: "June",
        40: "September",

    };

    const label = svg.append('g').selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            // Move the labels outside of the outer radius
            return "rotate(" + ((x(d.week) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + (outerRadius + 40) + ",0)";
        });

    // Append text only for specified weeks
    label.filter(function (d) { return monthMapping[d.week]; })
        .append("text")
        .attr("transform", function (d) {
            return (x(d.week) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
        })
        .attr("fill", "#808080")  // Grey color for the text
        .text(function (d) {
            return monthMapping[d.week]; // Use month names based on the week number
        });

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "10px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("pointer-events", "none");
    console.log(tooltip)

    // Draw arcs with tooltip
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc)
        .on("mouseover", function (event, d) {
            tooltip.html(`Week: ${d.week}<br>Type: ${d.type}<br>Percentage: ${d.revenue}%`)
                .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        })
}

function createRadialChartMonth(svg, data, title, totalRevenue, scaleRadius, types) {
    const width = 450, height = 550;
    const innerRadius = 150, outerRadius = Math.min(width + scaleRadius, height) / 2;
    const year = d3.select("#year").property("value");



    // Setup scales and arcs
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, 2 * Math.PI])
        .align(0);

    const y = d3.scaleRadial()
        .domain([0, d3.max(data, d => d.revenue)])
        .range([innerRadius, outerRadius]);

    const arc = d3.arc()
        .innerRadius(d => y(0))
        .outerRadius(d => y(d.revenue * 1.25))
        .startAngle(d => x(d.month))
        .endAngle(d => x(d.month) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(types)
        .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);
    // Draw arcs
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    // Add title
    svg.append("text")
        .attr("x", 110)
        .attr('class', 'legend')
        .attr("y", -outerRadius - 16)
        .attr("text-anchor", "middle")
        .text(`${title} - ${year}`);


    svg.append("g")
        .attr("text-anchor", "middle")
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
        )
        .call(g => g.selectAll("g")
            .data(y.ticks(5).slice(1))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.3)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));

    svg.append("text")
        .attr("x", 0)
        .attr("y", 100)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text(`${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);

    const monthMapping = {
        1: "January",
        3: "March",
        6: "June",
        9: "September",

    };

    const label = svg.append('g').selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "rotate(" + ((x(d.month) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)";
        });

    // Append tick marks only for specified weeks
    label.filter(function (d) { return monthMapping[d.month]; })  // Only select data points that are in the monthMapping
        .append("line")
        .attr("x2", -5)
        .attr("stroke", "#808080");  // Grey color for the tick mark

    // Append text only for specified weeks
    label.filter(function (d) { return monthMapping[d.month]; })
        .append("text")
        .attr("transform", function (d) {
            return (x(d.week) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
        })
        .attr("fill", "#808080")  // Grey color for the text
        .text(function (d) {
            return monthMapping[d.month]; // Use month names based on the week number
        });

    const tooltip = d3.select("#tooltip")
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc)
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible");
            console.log(2)
            drawDonutChart(d.proportion); // Assuming 'd.details' holds the breakdown data for the donut
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
            d3.select(".tooltip svg").remove(); // Optionally clear the donut chart
        });

}



function createRadialCharRelative(svg, data, title, totalRevenue, scaleRadius, types) {
    const width = 450, height = 550;
    const innerRadius = 150, outerRadius = Math.min(width + scaleRadius, height) / 2;
    const year = d3.select("#year").property("value");

    // const totalRevenue = d3.max(data.total);

    // console.log(data)
    // Setup scales and arcs
    const x = d3.scaleBand()
        .domain(data.map(d => d.week))
        .range([0, 2 * Math.PI])
        .align(0);

    const y = d3.scaleRadial()
        .domain([0, d3.max(data, d => d.proportion)])
        .range([innerRadius, outerRadius]);

    const arc = d3.arc()
        .innerRadius(d => y(0))
        .outerRadius(d => y(d.proportion * 1.25))
        .startAngle(d => x(d.week))
        .endAngle(d => x(d.week) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(types)
        .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);
    // Draw arcs
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    // Add title
    svg.append("text")
        .attr("x", 110)
        .attr('class', 'legend')
        .attr("y", -outerRadius - 16)
        .attr("text-anchor", "middle")
        .text(`${title} - ${year}`);


    svg.append("g")
        .attr("text-anchor", "middle")
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
        )
        .call(g => g.selectAll("g")
            .data(y.ticks(5).slice(1))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.3)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));

    svg.append("text")
        .attr("x", 0)
        .attr("y", 100)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text(`${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);
    //   add time points
    const monthMapping = {
        1: "January",
        13: "March",
        27: "June",
        40: "September",

    };

    const label = svg.append('g').selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "rotate(" + ((x(d.week) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)";
        });

    // Append tick marks only for specified weeks
    label.filter(function (d) { return monthMapping[d.week]; })  // Only select data points that are in the monthMapping
        .append("line")
        .attr("x2", -5)
        .attr("stroke", "#808080");  // Grey color for the tick mark

    // Append text only for specified weeks
    label.filter(function (d) { return monthMapping[d.week]; })
        .append("text")
        .attr("transform", function (d) {
            return (x(d.week) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
        })
        .attr("fill", "#808080")  // Grey color for the text
        .text(function (d) {
            return monthMapping[d.week]; // Use month names based on the week number
        });
    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "10px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("pointer-events", "none");
    console.log(tooltip)

    // Draw arcs with tooltip
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc)
        .on("mouseover", function (event, d) {
            tooltip.html(`Week: ${d.week}<br>Type: ${d.type}<br>Percentage: ${d.proportion}%`)
                .style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        })

}


function createRadialChartMonthRelative(svg, data, title, totalRevenue, scaleRadius, types) {
    const width = 450, height = 550;
    const innerRadius = 150, outerRadius = Math.min(width + scaleRadius, height) / 2;
    const year = d3.select("#year").property("value");



    // Setup scales and arcs
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, 2 * Math.PI])
        .align(0);

    const y = d3.scaleRadial()
        .domain([0, d3.max(data, d => d.proportion)])
        .range([innerRadius, outerRadius]);

    const arc = d3.arc()
        .innerRadius(d => y(0))
        .outerRadius(d => y(d.proportion * 1.25))
        .startAngle(d => x(d.month))
        .endAngle(d => x(d.month) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(types)
        .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"]);
    // Draw arcs
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    // Add title
    svg.append("text")
        .attr("x", 110)
        .attr('class', 'legend')
        .attr("y", -outerRadius - 16)
        .attr("text-anchor", "middle")
        .text(`${title} - ${year}`);


    svg.append("g")
        .attr("text-anchor", "middle")
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
        )
        .call(g => g.selectAll("g")
            .data(y.ticks(5).slice(1))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.3)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));

    svg.append("text")
        .attr("x", 0)
        .attr("y", 100)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .text(`${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);


    // add specific time points
    const monthMapping = {
        1: "January",
        3: "March",
        6: "June",
        9: "September",

    };

    const label = svg.append('g').selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "rotate(" + ((x(d.month) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)";
        });

    // Append tick marks only for specified weeks
    label.filter(function (d) { return monthMapping[d.month]; })  // Only select data points that are in the monthMapping
        .append("line")
        .attr("x2", -5)
        .attr("stroke", "#808080");  // Grey color for the tick mark

    // Append text only for specified weeks
    label.filter(function (d) { return monthMapping[d.month]; })
        .append("text")
        .attr("transform", function (d) {
            return (x(d.week) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
        })
        .attr("fill", "#808080")  // Grey color for the text
        .text(function (d) {
            return monthMapping[d.month]; // Use month names based on the week number
        });

    // tooltip
    const tooltip = d3.select("#tooltip")

    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc)
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible");
            console.log(2)
            drawDonutChart(d.proportion); // Assuming 'd.details' holds the breakdown data for the donut
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
            d3.select(".tooltip svg").remove(); // Optionally clear the donut chart
        });


    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc)
        .on("mouseover", (event, d) => showDonutChart(d, color))
        .on("mouseout", hideDonutChart);

    function showDonutChart(d, color) {
        const donutData = d.proportion; // Ensure 'details' is structured for pie layout
        drawDonutChart(donutData, color);
    }

    function hideDonutChart() {
        d3.select("#donut").html(""); // Clear the donut chart
    }



}

function drawDonutChart(data, color) {
    const width = 200, height = 200, radius = Math.min(width, height) / 2;

    const svg = d3.select("#donut").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 70);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const g = svg.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", d => color(d.data.type));

    g.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .text(d => d.data.type);
}

// Add an SVG element to the body or specific div for the donut chart
d3.select("body").append("div").attr("id", "donut");