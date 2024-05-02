d3.json("weekly_revenue.json").then(function(data) {
    const slider = d3.select("#year");

    // Slider input event listener
    slider.on("input", function() {
        // Convert the slider value from string to integer
        const year = parseInt(this.value);
        // console.log("Slider New Value:", year);  // Log the converted integer value
        drawCharts(data, year);  // Pass the integer year to the drawCharts function
    });

    // Initial chart drawing with the slider's initial value converted to integer
    drawCharts(data, parseInt(slider.property("value")));
});

function drawCharts(data, year) {
    const filteredData = data.filter(d => d.year === parseInt(year));
    const businessUnits = d3.groups(filteredData, d => d.business_unit);

  


    // Clear previous charts
    const chartContainer = d3.select("#chart");
    chartContainer.html(''); // Clear previous charts

    // Append a div for each business unit chart to manage with flexbox
    businessUnits.forEach(([unit, unitData], index) => {
        const totalRevenue = d3.sum(unitData, d => d.revenue);
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

        // Now pass the SVG, data, title, year, and total revenue to create the radial chart
        createRadialChart(svg, unitData, ` ${unit}`, totalRevenue);
    });
}

function createRadialChart(svg, data, title, totalRevenue) {
    const width = 550, height = 550;
    const innerRadius = 140, outerRadius = Math.min(width, height) / 2;
    const year = d3.select("#year").property("value");
    
    // const totalRevenue = d3.max(data.total);

    console.log(data)
    // Setup scales and arcs
    const x = d3.scaleBand()
        .domain(data.map(d => d.week))
        .range([0, 2 * Math.PI])
        .align(0);

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
        .domain(data.map(d => d.type))
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    // Draw arcs
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr('class', 'legend')
        .attr("y", -outerRadius + 185)
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


        svg.append("g")
        .selectAll()
        .data(color.domain())
        .join("g")
          .attr("transform", (d, i, nodes) => `translate(-40,${(nodes.length / 2 - i - 1) * 20})`)
          .call(g => g.append("rect")
              .attr("width", 15)
              .attr("height", 18)
              .attr("fill", color))
          .call(g => g.append("text")
              .attr("x", 22)
              .attr("y", 9)
              .attr("dy", "0.35em")
              .text(d => d));

              svg.append("text")
              .attr("x", 0)
              .attr("y", 100)
              .attr("text-anchor", "middle")
              .style("font-size", "13px")
              .style("font-weight", "bold")
              .text(`Total Revenue: ${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);
      
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

// Draw arcs with tooltip
svg.selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("fill", d => color(d.type))
    .attr("d", arc)
    .on("mouseover", function(event, d) {
        tooltip.html(`Week: ${d.week}<br>Type: ${d.type}<br>Percentage: ${d.revenue}%`)
               .style("visibility", "visible");
    })
    .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
    })
    
}


function createRadialChartMonth(svg, data, title, totalRevenue) {
    const width = 550, height = 550;
    const innerRadius = 180, outerRadius = Math.min(width, height) / 2;
    const year = d3.select("#year").property("value");
    
    // const totalRevenue = d3.max(data.total);

    console.log(data)
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
        .domain(data.map(d => d.type))
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    // Draw arcs
    svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("fill", d => color(d.type))
        .attr("d", arc);

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr('class', 'legend')
        .attr("y", -outerRadius + 185)
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


        svg.append("g")
        .selectAll()
        .data(color.domain())
        .join("g")
          .attr("transform", (d, i, nodes) => `translate(-40,${(nodes.length / 2 - i - 1) * 20})`)
          .call(g => g.append("rect")
              .attr("width", 15)
              .attr("height", 18)
              .attr("fill", color))
          .call(g => g.append("text")
              .attr("x", 22)
              .attr("y", 9)
              .attr("dy", "0.35em")
              .text(d => d));

              svg.append("text")
              .attr("x", 0)
              .attr("y", 100)
              .attr("text-anchor", "middle")
              .style("font-size", "13px")
              .style("font-weight", "bold")
              .text(`Total Revenue: ${totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).slice(0, -3)}`);
      
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

// Draw arcs with tooltip
svg.selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("fill", d => color(d.type))
    .attr("d", arc)
    .on("mouseover", function(event, d) {
        tooltip.html(`Week: ${d.week}<br>Type: ${d.type}<br>Percentage: ${d.revenue}%`)
               .style("visibility", "visible");
    })
    .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
    })
    
}