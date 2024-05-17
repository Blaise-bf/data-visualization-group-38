

d3.json("network_data.json").then(function (data) {



  console.log(data);

  arcDiagram(data);
})



function arcDiagram(data) {

  const source = data.nodes;
  const target = data.links;


  const orders = calculateOrders(source, target)

  // Specify the chart’s dimensions.
  const width = 800;
  const step = 25;
  const marginTop = 25;
  const marginRight = 20;
  const marginBottom = 20;
  const marginLeft = 210;
  const height = (source.length - 1) * step + marginTop + marginBottom;
  const y = d3.scalePoint(orders.get("by name"), [marginTop, height - marginBottom]);

  // A color scale for the nodes and links.
  const color = d3.scaleOrdinal()
    .domain(source.map(d => d.group).sort(d3.ascending))
    .range(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"])
    .unknown("#aaa");

  // A function of a link, that checks that source and target have the same group and returns
  // the group; otherwise null. Used to color the links.
  const groups = new Map(source.map(d => [d.id, d.group]));
  function samegroup({ source, target }) {
    return groups.get(source) === groups.get(target) ? groups.get(source) : null;
  }

  const container = d3.select('#arc-chart')

  // Create the SVG container.
  const svg = container.append("svg")
    .attr("width", width)  // The width of the SVG in pixels
    .attr("height", height)  // The height of the SVG in pixels
    .attr("viewBox", [0, 0, width, height + 30])  // Adjust these values to change zoom level
    .attr("style", "max-width: 100%; height: auto;"); // Added border for clarity


  // The current position, indexed by id. Will be interpolated.
  const Y = new Map(source.map(({ id }) => [id, y(id)]));

  // Add an arc for each link.
  function arc(d) {
    const y1 = Y.get(d.source);
    const y2 = Y.get(d.target);
    const r = Math.abs(y2 - y1) / 2;
    return `M${marginLeft},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${marginLeft},${y2}`;
  }
  const path = svg.insert("g", "*")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(target)
    .join("path")
    .attr("stroke", d => color(samegroup(d)))
    .attr("d", arc);

  // Add a text label and a dot for each node.
  const label = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 11)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(source)
    .join("g")
    .attr("transform", d => `translate(${marginLeft},${Y.get(d.id)})`)
    .call(g => g.append("text")
      .attr("x", -6)
      .attr("dy", "0.35em")
      .attr("fill", d => d3.lab(color(d.group)).darker(2))
      .text(d => d.id))
    .call(g => g.append("circle")
      .attr("r", 3)
      .attr("fill", d => color(d.group)));

  // Add invisible rects that update the class of the elements on mouseover.
  label.append("rect")
    .attr("fill", "none")
    .attr("width", marginLeft)
    .attr("height", step)
    .attr("x", -marginLeft)
    .attr("y", -step / 2)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("pointerenter", (event, d) => {
      svg.classed("hover", true);
      label.classed("primary", n => n === d);
      label.classed("secondary", n => target.some(({ source, target }) => (
        n.id === source && d.id == target || n.id === target && d.id === source
      )));
      path.classed("primary", l => l.source === d.id || l.target === d.id).filter(".primary").raise();
    })
    .on("pointerout", () => {
      svg.classed("hover", false);
      label.classed("primary", false);
      label.classed("secondary", false);
      path.classed("primary", false).order();
    });

  const legend = svg.append("g")
    .attr("transform", `translate(${width - marginRight - 95}, ${marginTop})`);

  source.map(d => d.group)
    .filter((value, index, self) => self.indexOf(value) === index) // Unique values
    .sort(d3.ascending)
    .forEach((group, index) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${index * 20})`);

      legendRow.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(group));

      legendRow.append("text")
        .attr("x", 28)
        .attr("y", 9)
        .attr("dy", "0.45em")
        .text(group)
        .style("font-family", "Cursive")
        .style("font-size", "14px");


      // Add styles for the hover interaction.
      svg.append("style").text(`
  .hover text { fill: #aaa; }
  .hover g.primary text { font-weight: bold; fill: #333; }
  .hover g.secondary text { fill: #333; }
  .hover path { stroke: #ccc; }
  .hover path.primary { stroke: #333; }`);

      //   return Object.assign(svg.node(), {update});

    });


  // A function that updates the positions of the labels and recomputes the arcs
  // when passed a new order.
  function update(order) {
    y.domain(order);

    label
      .sort((a, b) => d3.ascending(Y.get(a.id), Y.get(b.id)))
      .transition()
      .duration(750)
      .delay((d, i) => i * 20) // Make the movement start from the top.
      .attrTween("transform", d => {
        const i = d3.interpolateNumber(Y.get(d.id), y(d.id));
        return t => {
          const y = i(t);
          Y.set(d.id, y);
          return `translate(${marginLeft},${y})`;
        }
      });

    path.transition()
      .duration(750 + source.length * 20) // Cover the maximum delay of the label transition.
      .attrTween("d", d => () => arc(d));
  }
}
function calculateOrders(source, target) {
  if (!source || !target) {
    console.error("Source or target data is undefined");
    return;
  }

  // Calculate degrees using d3.rollup
  const degree = d3.rollup(
    target.flatMap(({ source, target, value }) => [
      { node: source, value },
      { node: target, value }
    ]),
    values => d3.sum(values, ({ value }) => value),
    d => d.node
  );

  // Return a new Map with sorted data
  return new Map([
    ["by name", source.map(d => d.id).sort(d3.ascending)],
    ["by group", source.slice().sort((a, b) => {
      return d3.ascending(a.group, b.group) || d3.ascending(a.id, b.id);
    }).map(d => d.id)],
    ["by degree", source.slice().sort((a, b) => {
      return d3.descending(degree.get(a.id), degree.get(b.id));
    }).map(d => d.id)]
  ]);
}
