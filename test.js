const slider = document.getElementById('year');
const output = document.getElementById('updates');
const dataFrequencySelector = document.getElementById('data-frequency');

output.innerHTML = `Displaying ${dataFrequencySelector.value} trend for the year ${slider.value}`; // Display the default slider value

function loadData() {
    const year = parseInt(slider.value);
    const frequency = dataFrequencySelector.value;
    const dataSource = frequency === 'weekly' ? 'weekly_revenue.json' : 'monthly_revenue.json';

    d3.json(dataSource).then(function(data) {
        const filteredData = data.filter(d => d.year === year);
        const uniqueTypes = Array.from(d3.group(filteredData, d => d.type).keys());

        console.log(uniqueTypes);
        drawCharts(filteredData, year, frequency, uniqueTypes);
    });
}

// Update the chart when the data frequency changes
dataFrequencySelector.addEventListener('change', loadData);

// Update the chart when the year changes
slider.addEventListener('input', function() {
    output.innerHTML = `Displaying ${dataFrequencySelector.value} trend for the year ${this.value}`; // Display the default slider value;  // Update the displayed year
    loadData();  // Load the data with the new year
});

// Initial data load
loadData();


function drawCharts(data, year, frequency, types) {
 
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
        const scaleRadius = (OvearallRevenue/totalRevenue * 100) * 2; // Scale proportionally
        

        // Now pass the SVG, data, title, year, and total revenue to create the radial chart

        if (frequency === "weekly") {
            createRadialChart(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types);
        } else {

            createRadialChartMonth(svg, unitData, ` ${unit}`, OvearallRevenue, scaleRadius, types)
        }
        
    });
}

function createRadialChart(svg, data, title, totalRevenue, scaleRadius, types) {
    const width = 450, height = 550;
    const innerRadius = 150,  outerRadius = Math.min(width + scaleRadius , height) / 2;
    const year = d3.select("#year").property("value");
    
    // const totalRevenue = d3.max(data.total);

    // console.log(data)
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
        .domain(types)
        .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]);
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
        .attr("y", -outerRadius + 165)
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
    console.log(tooltip)

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


function createRadialChartMonth(svg, data, title, totalRevenue, scaleRadius, types) {
    const width = 450, height = 550;
    const innerRadius = 150,  outerRadius = Math.min(width + scaleRadius , height) / 2;
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
        .domain(typ)
        .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"]);
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
        .attr("y", -outerRadius + 165)
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
      
            const tooltip = d3.select("#tooltip")

              svg.selectAll("path")
    .data(data)
    .enter().append("path")
    .attr("fill", d => color(d.type))
    .attr("d", arc)
    .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible");
        console.log(2)
        drawDonutChart(d.percentage); // Assuming 'd.details' holds the breakdown data for the donut
    })
    .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
        d3.select(".tooltip svg").remove(); // Optionally clear the donut chart
    });

          
        //   svg.selectAll("path")
        //       .data(data)
        //       .enter().append("path")
        //       .attr("fill", d => color(d.type))
        //       .attr("d", arc)
        //       .on("mouseover", (event, d) => {
        //           console.log("Mouseover data:", d); // Check what data looks like in the console
        //           tooltip.html(`Week: ${d.week}<br>Type: ${d.type}<br>Revenue: ${d.revenue.toLocaleString()}%`)
        //                  .style("visibility", "visible")
        //                  .style("left", (event.pageX + 10) + "px") // Ensure it follows the mouse or is positioned correctly
        //                  .style("top", (event.pageY - 10) + "px");
        //       })
        //       .on("mousemove", (event) => {
        //           tooltip.style("left", (event.pageX + 10) + "px")
        //                  .style("top", (event.pageY - 10) + "px");
        //       })
        //       .on("mouseout", () => {
        //           tooltip.style("visibility", "hidden");
        //       });
          
    
}


function drawDonutChart(data) {
    // Define width, height, radius
    const width = 200, height = 200;
    const radius = Math.min(width, height) / 2;

    // Remove any existing SVG first (if you are reusing the tooltip div)
    d3.select(".tooltip svg").remove();

    const svg = d3.select(".tooltip").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc()
        .innerRadius(radius * 0.5) // Adjust to get donut thickness
        .outerRadius(radius);

    const pie = d3.pie()
        .sort(null) // if you don't want to sort the data
        .value(d => d.value);

    const path = svg.selectAll("path")
        .data(pie(data))
        .enter().append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]); // Color scheme

    // Optionally add text or other markers
}
