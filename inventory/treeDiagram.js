d3.json("products_basket_analysis.json").then(function (data) {
    const width = 1450;
    const height = 950;
    const radius = Math.min(width, height) / 2.2;

    // Create hierarchy from the data
    const hierarchyRoot = d3.hierarchy(data);

    // Create a radial layout
    const radialLayout = d3.tree()
        .size([2 * Math.PI, radius]);

    // Generate tree nodes and links
    const treeData = radialLayout(hierarchyRoot);

    treeData.each(d => {
        const coords = polarToCartesian(d.x, d.y);
        d.coords = { x: coords.x, y: coords.y };

        // Adjust coordinates based on the rank if node has rank
        if (d.data.rank) {
            const rank = d.data.rank || 3; // Default rank is 3
            const lengthFactor = rank / 3; // Factor for adjusting length
            d.coords.x *= lengthFactor;
            d.coords.y *= lengthFactor;
        }
    });

    // Adjust node positioning
    const svg = d3.select("#tree-container")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Render nodes
    const nodeCoords = {};

    function createUniqueId(node) {
        let path = [];
        let current = node;
        while (current) {
            path.push(current.data.antecedent_name || current.data.area || current.data.value || current.data.consequent_name_1 || current.data.consequent_name_2);
            current = current.parent;
        }
        return path.reverse().join('/');
    }

    // Render links
    const links = svg.selectAll(".link")
        .data(treeData.links().slice(5)) // Exclude links from origin to the first level
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            // Get adjusted source and target coordinates
            const sourceCoords = polarToCartesian(d.source.x, d.source.y);
            const targetCoords = polarToCartesian(d.target.x, d.target.y);
            let adjustedSourceCoords = { x: sourceCoords.x, y: sourceCoords.y };

            const rank = d.target.data.rank || 3;
            const lengthFactor = rank / 3;
            const dx = targetCoords.x - adjustedSourceCoords.x;
            const dy = targetCoords.y - adjustedSourceCoords.y;

            const adjustedTargetCoords = {
                x: adjustedSourceCoords.x + dx * lengthFactor,
                y: adjustedSourceCoords.y + dy * lengthFactor
            };

            // Store adjusted target coordinates using the unique ID
            nodeCoords[createUniqueId(d.target)] = adjustedTargetCoords;

            return "M" + adjustedSourceCoords.x + "," + adjustedSourceCoords.y +
                "L" + adjustedTargetCoords.x + "," + adjustedTargetCoords.y;
        })
        .style("stroke", d => {
            // Check if the source or target node is an antecedent_name with rank 3
            if ((d.source.data.antecedent_name && d.source.data.rank === 3) ||
                (d.target.data.antecedent_name && d.target.data.rank === 3)) {
                return "red"; // Set the color to red
            }
            if ((d.source.data.antecedent_name && d.source.data.rank === 2) ||
                (d.target.data.antecedent_name && d.target.data.rank === 2)) {
                return "green"; // Set the color to red
            } if ((d.source.data.antecedent_name && d.source.data.rank === 1) ||
                (d.target.data.antecedent_name && d.target.data.rank === 1)) {
                return "blue"; // Set the color to red
            } else {
                return "black"; // Default color
            }
        });

    // Render nodes
    const nodes = svg.selectAll(".node")
        .data(treeData.descendants().slice(1)) // Exclude the origin node
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => {
            let coords;
            const uniqueId = createUniqueId(d);
            if (nodeCoords[uniqueId]) {
                coords = nodeCoords[uniqueId];
            } else {
                coords = polarToCartesian(d.x, d.y);
            }
            return `translate(${coords.x},${coords.y})`;
        })

    nodes.append("circle")
        .attr("r", 5)
        .style("fill", d => {
            // Color nodes of rank 3 and those connected to nodes of rank 3 red
            if (d.data.rank === 3 || (d.parent && d.parent.data.rank === 3)) {
                return "red";
            } if (d.data.rank === 2 || (d.parent && d.parent.data.rank === 2)) {
                return "green";
            } if (d.data.rank === 1 || (d.parent && d.parent.data.rank === 1)) {
                return "blue";
            } else {
                return "black";
            }
        })
        .style("stroke", d => {
            // Color nodes of rank 3 and those connected to nodes of rank 3 red
            if (d.data.rank === 3 || (d.parent && d.parent.data.rank === 3)) {
                return "red";
            } if (d.data.rank === 2 || (d.parent && d.parent.data.rank === 2)) {
                return "green";
            } if (d.data.rank === 1 || (d.parent && d.parent.data.rank === 1)) {
                return "blue";
            } else {
                return "black";
            }
        })

    nodes.append("text")
        .attr("dy", "0.31em")
        .attr("text-anchor", "middle") // Center text horizontally
        .attr("dominant-baseline", "middle") // Center text vertically
        .attr("transform", d => d.x >= Math.PI ? "rotate(360)" : null)
        .text(d => d.data.antecedent_name || d.data.area || d.data.value || d.data.consequent_name_1 || d.data.consequent_name_2);

    // Update links to use adjusted coordinates for children of antecedent_name
    links.attr("d", d => {
        // Get adjusted source and target coordinates
        const sourceCoords = nodeCoords[createUniqueId(d.source)] || polarToCartesian(d.source.x, d.source.y);
        const targetCoords = polarToCartesian(d.target.x, d.target.y);

        // Calculate adjusted target coordinates for links
        const rank = d.target.data.rank || 3;
        const lengthFactor = rank / 3;
        const dx = targetCoords.x - sourceCoords.x;
        const dy = targetCoords.y - sourceCoords.y;

        const adjustedTargetCoords = {
            x: sourceCoords.x + dx * lengthFactor,
            y: sourceCoords.y + dy * lengthFactor
        };
        return "M" + sourceCoords.x + "," + sourceCoords.y +
            "L" + adjustedTargetCoords.x + "," + adjustedTargetCoords.y;
    });

});

// Function to convert polar coordinates to Cartesian coordinates
function polarToCartesian(angle, radius) {
    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
    };
}