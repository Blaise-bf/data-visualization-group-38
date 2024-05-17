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

    // Function to convert polar coordinates to Cartesian coordinates
    function polarToCartesian(angle, radius) {
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };
    }

    // Adjust node coordinates based on the rank
    treeData.each(d => {
        const coords = polarToCartesian(d.x, d.y);
        d.coords = { x: coords.x, y: coords.y };

        // Adjust coordinates based on the rank if node has rank
        if (d.data.rank) {
            const rank = d.data.rank || 3;
            const lengthFactor = rank / 3;
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

    // Append legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (-700) + "," + -400 + ")");

    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 10)
        .attr("r", 5)
        .style("fill", "red");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text("Most bought product");

    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 30)
        .attr("r", 5)
        .style("fill", "green");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text("Second most bought product");

    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 50)
        .attr("r", 5)
        .style("fill", "blue");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 50)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text("Third most bought product");

    legend.append("circle")
        .attr("cx", 10)
        .attr("cy", 70)
        .attr("r", 5)
        .style("fill", "black");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 70)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text("Areas");

    // Render links
    const links = svg.selectAll(".link")
        .data(treeData.links().slice(5))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d => {

            const sourceCoords = nodeCoords[createUniqueId(d.source)] || polarToCartesian(d.source.x, d.source.y);
            const targetCoords = polarToCartesian(d.target.x, d.target.y);

            let adjustedTargetCoords = { x: targetCoords.x, y: targetCoords.y };


            if (d.source.data.antecedent_name && (d.target.data.value || d.target.data.consequent_name_1 || d.target.data.consequent_name_2)) {
                const rank = d.source.data.rank || 3;
                const lengthFactor = rank / 3;
                const dx = targetCoords.x - sourceCoords.x;
                const dy = targetCoords.y - sourceCoords.y;

                adjustedTargetCoords = {
                    x: sourceCoords.x + dx * lengthFactor,
                    y: sourceCoords.y + dy * lengthFactor
                };
            }


            nodeCoords[createUniqueId(d.target)] = adjustedTargetCoords;

            return "M" + sourceCoords.x + "," + sourceCoords.y +
                "L" + adjustedTargetCoords.x + "," + adjustedTargetCoords.y;
        })
        .style("stroke", d => {

            if ((d.source.data.antecedent_name && d.source.data.rank === 3) ||
                (d.target.data.antecedent_name && d.target.data.rank === 3)) {
                return "red";
            }
            if ((d.source.data.antecedent_name && d.source.data.rank === 2) ||
                (d.target.data.antecedent_name && d.target.data.rank === 2)) {
                return "green";
            } if ((d.source.data.antecedent_name && d.source.data.rank === 1) ||
                (d.target.data.antecedent_name && d.target.data.rank === 1)) {
                return "blue";
            } else {
                return "black";
            }
        });

    // Render nodes
    const nodes = svg.selectAll(".node")
        .data(treeData.descendants().slice(1))
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
        });

    nodes.append("circle")
        .attr("r", 5)
        .style("fill", d => {
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
            if (d.data.rank === 3 || (d.parent && d.parent.data.rank === 3)) {
                return "red";
            } if (d.data.rank === 2 || (d.parent && d.parent.data.rank === 2)) {
                return "green";
            } if (d.data.rank === 1 || (d.parent && d.parent.data.rank === 1)) {
                return "blue";
            } else {
                return "black";
            }
        });

    nodes.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("transform", d => d.x >= Math.PI ? "rotate(360)" : null)
        .attr("transform", d => {
            let transform = "";
            if (d.x >= Math.PI) transform += "rotate(360)";
            if (d.data.area) {
                const areaFactor = 0.7;
                const xOffset = d.coords.x * (1 - areaFactor);
                const yOffset = d.coords.y * (1 - areaFactor);
                transform += ` translate(${-xOffset},${-yOffset})`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "South" && (d.data.consequent_name_1 || d.data.consequent_name_2)) {
                const xOffset = -120;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent && d.parent.data.area === "South" && d.data.antecedent_name === "Living Heavy Armour (Mythal)") {
                const xOffset = 0;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent && d.parent.data.area === "South" && d.data.antecedent_name === "Adamantine Armour (Red Curtain)") {
                const xOffset = 40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent && d.parent.data.area === "South" && d.data.antecedent_name === "Veterans Cane (Sable)") {
                const xOffset = 50;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "South" && (d.data.value)) {
                const xOffset = -40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "South" && d.parent.data.antecedent_name === "Living Heavy Armour (Mythal)" && d.data.consequent_name_1) {
                const xOffset = -25;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "South" && d.parent.data.antecedent_name === "Veterans Cane (Sable)" && d.data.consequent_name_1) {
                const xOffset = -35;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Tentacle Rod (Mythal)" && (d.data.consequent_name_1 || d.data.consequent_name_2)) {
                const xOffset = -80;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Tentacle Rod (Mythal)" && d.data.value) {
                const xOffset = -40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Half plate  (Red Curtain)" && d.data.value) {
                const xOffset = -40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Half plate  (Red Curtain)" && d.data.consequent_name_2) {
                const xOffset = 50;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Half plate  (Red Curtain)" && d.data.consequent_name_1) {
                const xOffset = -50;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Armour of Vulnerability (Mythal)" && d.data.value) {
                const xOffset = -40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Armour of Vulnerability (Mythal)" && d.data.consequent_name_2) {
                const xOffset = 50;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Studded leather armour (U.N.N.)" && d.data.value) {
                const xOffset = -20;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Studded leather armour (U.N.N.)" && d.data.consequent_name_1) {
                const xOffset = 105;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Studded leather armour (U.N.N.)" && d.data.consequent_name_2) {
                const xOffset = 110;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Splint mail (Red Curtain)" && d.data.value) {
                const xOffset = 40;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Splint mail (Red Curtain)" && d.data.consequent_name_1) {
                const xOffset = 105;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Splint mail (Red Curtain)" && d.data.consequent_name_2) {
                const xOffset = 90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent && d.parent.data.area === "West" && d.data.antecedent_name === "Battleaxe  (U.N.N.)") {
                const xOffset = -60;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Battleaxe  (U.N.N.)" && d.data.value) {
                const xOffset = 35;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Battleaxe  (U.N.N.)" && d.data.consequent_name_1) {
                const xOffset = 85;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Battleaxe  (U.N.N.)" && d.data.consequent_name_2) {
                const xOffset = 85;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent && d.parent.data.area === "East" && d.data.antecedent_name === "Quarterstaff  (Borderlands)") {
                const xOffset = -60;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.value) {
                const xOffset = 45;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_1) {
                const xOffset = 95;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_2) {
                const xOffset = 95;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Staff of Fire (Borderlands)" && d.data.value) {
                const xOffset = 45;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Staff of Fire (Borderlands)" && d.data.consequent_name_1) {
                const xOffset = 90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Staff of Fire (Borderlands)" && d.data.consequent_name_2) {
                const xOffset = 90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Red Curtain)" && d.data.value) {
                const xOffset = 45;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Red Curtain)" && d.data.consequent_name_1) {
                const xOffset = 90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Red Curtain)" && d.data.consequent_name_2) {
                const xOffset = 30;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.value) {
                const xOffset = 55;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.consequent_name_1) {
                const xOffset = 90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.consequent_name_2) {
                const xOffset = -70;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.value) {
                const xOffset = 1;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_1) {
                const xOffset = -90;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_2) {
                const xOffset = -110;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Morningstar  (Red Curtain)" && d.data.value) {
                const xOffset = 1;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Morningstar  (Red Curtain)" && d.data.consequent_name_1) {
                const xOffset = -110;
                transform += ` translate(${xOffset},0)`;
            }
            if (d.parent.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Morningstar  (Red Curtain)" && d.data.consequent_name_2) {
                const xOffset = -90;
                transform += ` translate(${xOffset},0)`;
            }
            return transform;
        })
        .attr("dy", d => {
            if (d.parent && d.parent && d.parent.data.area === "South" && (d.data.antecedent_name)) {
                return "0.8em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "South" && d.parent.data.antecedent_name === "Veterans Cane (Sable)" && d.data.value) {
                return "0.3em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "South" && d.parent.data.antecedent_name === "Veterans Cane (Sable)" && d.data.consequent_name_1) {
                return "-0.3em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "South" && d.parent.data.antecedent_name === "Veterans Cane (Sable)" && d.data.consequent_name_2) {
                return "-0.9em";
            }
            if (d.parent && d.parent && d.parent.data.area === "Underdark" && d.data.antecedent_name) {
                return "0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Half plate  (Red Curtain)" && d.data.consequent_name_1) {
                return "-0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Half plate  (Red Curtain)" && d.data.consequent_name_2) {
                return "-0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Armour of Vulnerability (Mythal)" && d.data.consequent_name_1) {
                return "-0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "Underdark" && d.parent.data.antecedent_name === "Armour of Vulnerability (Mythal)" && d.data.consequent_name_2) {
                return "-1.9em";
            }
            if (d.parent && d.parent && d.parent.data.area === "West" && d.data.antecedent_name) {
                return "1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Studded leather armour (U.N.N.)" && d.data.value) {
                return "-0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Battleaxe  (U.N.N.)" && d.data.value) {
                return "-0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "West" && d.parent.data.antecedent_name === "Battleaxe  (U.N.N.)" && d.data.consequent_name_2) {
                return "0.9em";
            }
            if (d.parent && d.parent && d.parent.data.area === "East" && d.data.antecedent_name) {
                return "-1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Red Curtain)" && d.data.consequent_name_1) {
                return "0.9em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "East" && d.parent.data.antecedent_name === "Quarterstaff  (Red Curtain)" && d.data.consequent_name_2) {
                return "1.9em";
            }
            if (d.parent && d.parent && d.parent.data.area === "North" && d.data.antecedent_name) {
                return "-1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.value) {
                return "0.1em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.consequent_name_1) {
                return "1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Ironfang (Sable)" && d.data.consequent_name_2) {
                return "1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.value) {
                return "1.2em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_1) {
                return "1em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Quarterstaff  (Borderlands)" && d.data.consequent_name_2) {
                return "0.1em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Morningstar  (Red Curtain)" && d.data.value) {
                return "1.5em";
            }
            if (d.parent.parent && d.parent && d.parent.parent.data.area === "North" && d.parent.data.antecedent_name === "Morningstar  (Red Curtain)" && d.data.consequent_name_1) {
                return "0.8em";
            }
        })
        .text(d => d.data.antecedent_name || d.data.area || d.data.value || d.data.consequent_name_1 || d.data.consequent_name_2);

    // Update links to use adjusted coordinates for children of antecedent_name
    links.attr("d", d => {

        const sourceCoords = nodeCoords[createUniqueId(d.source)] || polarToCartesian(d.source.x, d.source.y);
        const targetCoords = polarToCartesian(d.target.x, d.target.y);

        let adjustedTargetCoords = { x: targetCoords.x, y: targetCoords.y };

        if (d.source.data.antecedent_name && (d.target.data.value || d.target.data.consequent_name_1 || d.target.data.consequent_name_2)) {
            const rank = d.source.data.rank || 3;
            const lengthFactor = rank / 3;
            const dx = targetCoords.x - sourceCoords.x;
            const dy = targetCoords.y - sourceCoords.y;

            adjustedTargetCoords = {
                x: sourceCoords.x + dx * lengthFactor,
                y: sourceCoords.y + dy * lengthFactor
            };
        }

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
