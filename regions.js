

d3.json('regional_revenue.json').then(function(df) {
    
    const data = d3.groups(df, d => d.region, d => d.month)
  .map(([region, months]) => ({
    region,
    data: months.map(([month, accounts]) => ({
      month: month,
      accounts: accounts.map(d => ({
        type: d.account_type,
        revenue: d.revenue
      }))
    }))
  }));


  drawMatrix(data)
  console.log(data)
});

function drawMatrix(data) {

    const colorScale = d3.scaleOrdinal()
    .domain(["no key", "private", "premium"])
    .range(["#6b486b", "#a05d56", "#d0743c"]); 
const svg = d3.select("svg");
const margin = { top: 20, right: 20, bottom: 30, left: 120 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;


// Extract unique months and regions from the data
const months = [...new Set(data.flatMap(d => d.data.map(month => month.month)))];
const regions = data.map(d => d.region);

// Scales for the matrix grid
const xScale = d3.scaleBand()
  .domain(months)
  .range([0, width])
  .padding(0.1);

const yScale = d3.scalePoint()
  .domain(regions)
  .range([0, height])
  .padding(0.1);

// Scale for the bars within each cell
const xSubgroupScale = d3.scaleBand()
  .domain(["no key", "private", "premium"])
  .range([0, xScale.bandwidth()])
  .padding(0.05);

const ySubgroupScale = d3.scaleLinear()
  .domain([0, d3.max(data, region => d3.max(region.data, month => d3.max(month.accounts, account => account.revenue)))])
  .range([xScale.bandwidth(), 0]);
  const regionGroups = svg.selectAll(".region")
  .data(data)
  .enter().append("g")
  .attr("class", "region")
  .attr("transform", d => `translate(${margin.left}, ${yScale(d.region) + margin.top})`);

regionGroups.each(function(regionData) {
  const monthGroups = d3.select(this).selectAll(".month")
    .data(regionData.data)
    .enter().append("g")
    .attr("class", "month")
    .attr("transform", d => `translate(${xScale(d.month)}, 0)`);

  monthGroups.selectAll(".bar")
    .data(d => d.accounts)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xSubgroupScale(d.type))
    .attr("y", d => ySubgroupScale(d.revenue))
    .attr("width", xSubgroupScale.bandwidth())
    .attr("height", d => xScale.bandwidth() - ySubgroupScale(d.revenue))
    .attr("fill", d => colorScale(d.type));
});

// Add axes for clarity
svg.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
  .call(d3.axisBottom(xScale));

svg.append("g")
  .attr("class", "y axis")
  .attr("transform", `translate(${margin.left}, ${margin.top})`)
  .call(d3.axisLeft(yScale));

 // Example colors
}