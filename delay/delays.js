const slider = document.getElementById('year');

slider.addEventListener('input', function() {
    d3.json("delays.json").then(function (df) {
        let year = parseInt(slider.value);
        let filteredData = df.filter(d => parseInt(d.year) === year);
        drawCharts(filteredData);
    }).catch(console.error);
});



   
    // const frequency = dataFrequencySelector.value;
    // const dataSource = frequency === 'weekly' ? 'weekly_revenue.json' : 'monthly_revenue.json';
    d3.json("delays.json").then(function (df) {
        let initialYear = parseInt(slider.value);
        let initialData = df.filter(d => parseInt(d.year) === initialYear);
        drawCharts(initialData);
    }).catch(console.error);
    


function drawDelayPattern(svg, data) {
    const margin = { top: 20, right: 200, bottom: 50, left: 120 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

   
        svg.attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scalePoint()
        .domain(data.map(d => d.month_name))
        .range([0, width])
        .padding(0.5);
    
    const yScale = d3.scalePoint()
        .domain(data.map(d => d.type))
        .range([height, 0])
        .padding(0.5);
    

        console.log("xScale domain:", xScale.domain());
        console.log("yScale domain:", yScale.domain());
   
        

        svg.select('.x-axis').call(d3.axisBottom(xScale));
        svg.select('.y-axis').call(d3.axisLeft(yScale));
    
        // Draw or update the horizontal lines
        // const lines = svg.selectAll(".type-line")
        //     .data(data.map(d => d.type));
    
        // lines.enter()
        //     .append("line")
        //     .attr("class", "type-line")
        //     .merge(lines)
        //     .attr("x1", 0)
        //     .attr("x2", width)
        //     .attr("y1", d => yScale(d))
        //     .attr("y2", d => yScale(d))
        //     .attr("stroke", "teal")
        //     .attr("stroke-width", ".1");
    
        // lines.exit().remove();
    // const sizeScale = d3.scaleSqrt()
    //     .domain([0, d3.max(data, d => d3.max(d.data, dd => dd.delay))])
    //     .range([0, 20]);
    const legendPadding = 37;  // Space between the main plot and the legend


    const legendData = [
        {label: "Less than 3 days ", delay: 1},
        {label: "3 to 10 days ", delay: 5},
        {label: "11 to 30 days ", delay: 20},
        {label: "Over 30 days ", delay: 31}
    ];

    const mainPlotWidth = width;  // Assuming 'width' is the width of the main plot area
    const legendX = mainPlotWidth + legendPadding;  // x position for the legend
    const legendY = 270;  // y position for the legend, adjust as needed
    
    const legend = svg.append("g")
        .attr("transform", `translate(${legendX}, ${legendY})`);  // Move the legend to the right of the main plot
        legend.selectAll("legendGlyphs")
        .data(legendData)
        .enter().append("path")
        .attr("d", (d) => getDelayGlyph(d, 0, 1, 22, 10)) // Use getDelayGlyph to draw the glyph, adjust size and width as needed
        .attr("fill", "none")
        .attr("stroke", "teal")
        .attr("stroke-width", 2)
        .attr("transform", (d, i) => `translate(0, ${i * 40})`);  // Space out the glyphs vertically
    
    legend.selectAll("legendLabels")
        .data(legendData)
        .enter().append("text")
        .attr("x", 30)  // Offset text to the right of the glyph
        .attr("y", (d, i) => i * 40 + 4)  // Align text with glyphs
        .text(d => d.label)
        .attr("font-size", "11px")
        .attr("alignment-baseline", "middle");
    

        data.forEach(d => {
            const cx = xScale(d.month_name) + xScale.bandwidth() / 2;
            const cy = yScale(d.type) + yScale.bandwidth() / 1.5;
            const size = 52.5;  // Adjust this size as necessary
            
            const pathData = getDelayGlyph(d, cx, cy, size, width);
            svg.append('path')
                .attr('d', pathData)
                .attr('fill', 'none')
                .attr('stroke', 'teal')
                .attr('stroke-width', '1')
                .on('mouseover', function() {
                    d3.select("#tooltip")
                        .style("visibility", "visible")
                        .html(`Type: ${d.type}<br>Month: ${d.month_name} ${d.year}<br>Mean Delay: ${d.delay} days`);
                })
                .on('mousemove', function(event) {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on('mouseout', function() {
                    d3.select("#tooltip").style("visibility", "hidden");
                });
        });
        
        
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .call(d3.axisLeft(yScale));
}

function calculateOscillation(d) {
    let amplitude = 5;
    if (d.delay < 3) return amplitude * 10;
    else if (d.delay >= 3 && d.delay <= 10) return amplitude * 5;
    else if (d.delay > 10 && d.delay <= 30) return amplitude;
    else return 1;
}

function getGlyph(d, xScale, yScale) {
    const cx = xScale(d.month_name);
    const cy = yScale(d.type);
    const size = 10;  // Adjust this size as necessary

    console.log(`Processing: Month=${d.month_name}, Type=${d.type}, Delay=${d.delay}`);

    if (d.delay < 3) {
        console.log(`Full circle for ${d.type} in ${d.month_name}`);
        return `M ${cx} ${cy - size} a ${size} ${size} 0 1,0 ${size * 2},0 a ${size} ${size} 0 1,0 -${size * 2},0`;
    } else if (d.delay >= 3 && d.delay <= 10) {
        console.log(`Semi-circle for ${d.type} in ${d.month_name}`);
        return `M ${cx - size} ${cy} a ${size} ${size} 0 0,1 ${size * 2},0`;
    } else if (d.delay > 10 && d.delay <= 30) {
        console.log(`Quarter circle for ${d.type} in ${d.month_name}`);
        return `M ${cx - size} ${cy} l ${size} 0 l 0 ${size} l -${size} 0 z`;
    } else {
        console.log(`Flat line for ${d.type} in ${d.month_name}`);
        return `M ${cx - size} ${cy} l ${size * 2},0`;
    }
}



function getDelayGlyph(d, cx, cy, size, width) {
    let pathData = "";
    let numOscillations;
    if (d.delay < 3) {
        numOscillations = 7; // 7 oscillations for delay < 3 days
    } else if (d.delay >= 3 && d.delay <= 10) {
        numOscillations = 3; // 3 oscillations for delay between 3 and 10 days
    } else if (d.delay > 10 && d.delay <= 30) {
        // Semi-circle
        return `M ${cx - size * 0.7} ${cy} a ${size} ${size} 0 0,1 ${size * 1.5},0`;
    } else {
        // Flat line
        return `M ${cx - size * 0.5} ${cy} l ${size},0`;
    }

    // Calculate points for the spring if not a semi-circle or flat line
    const amplitude = size / 8.5;
    const length = size * 3.;
    const xOffset = cx - size*0.5;
    const yOffset = cy;

    const points = d3.range(numOscillations * 4 + 1).map(i => {
        const x = i / (numOscillations * 8) * length + xOffset;
        const y = yOffset + amplitude * Math.sin(i / 4.3 * 2.3 * Math.PI);
        return [x, y];
    });

    // Generate path data from points
    pathData = d3.line()(points);
    return pathData;
}


function drawCharts(data) {
 
const margin = { top: 20, right: 200, bottom: 50, left: 120 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous charts
    const chartContainer = d3.select("#chart");
    chartContainer.html(''); // Clear previous charts

    // Append a div for each business unit chart to manage with flexbox
   

const container = chartContainer.append("div")
    .style("flex", "1")
    .style("min-width", "600px"); // Ensure each chart has enough space



const svg = chartContainer.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xScale = d3.scalePoint()
    .range([0, width])
    .padding(0.5);

const yScale = d3.scalePoint()
    .range([height, 0])
    .padding(0.5);

svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`);

svg.append('g')
    .attr('class', 'y-axis');

function drawCharts(data) {
    xScale.domain(data.map(d => d.month_name).sort());
    yScale.domain(data.map(d => d.type));

    svg.select('.x-axis').call(d3.axisBottom(xScale));
    svg.select('.y-axis').call(d3.axisLeft(yScale));

    // Rest of your drawing code
    // Note: handle the creation and updating of your paths, circles, etc., here
}
            

        // Now pass the SVG, data, title, year, and total revenue to create the radial chart
            drawDelayPattern(svg, data)
}