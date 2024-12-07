// Função para carregar o JSON
async function loadJson() {
    const response = await fetch('./../credito_contratacao_contratado_pf_linha_estado.json');
    return await response.json();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 0
    }).format(value);
}

const sumFieldsPerPeriod = (periods, data) =>
    periods.map(period =>
        Object.values(data[period]).reduce((sum, value) => sum + value, 0)
    );

document.addEventListener("DOMContentLoaded", async () => {
    const data = await loadJson();
    const states = Object.keys(data).sort(); // Excluindo 'br' que parece ser uma soma nacional
    const categories = ["comercial", "fgts", "equity", "livre", "sfh", "total"];

    const stateSelector = document.getElementById('stateSelector');
    states.forEach(state => {
        let option = document.createElement("option");
        option.text = state.toUpperCase();
        option.value = state;
        stateSelector.add(option);
    });

    const chartsDiv = document.getElementById('charts');

    categories.forEach(category => {
        let div = document.createElement('div');
        div.className = 'chart';
        div.id = `chart_${category}`;
        div.innerHTML = `<h3>${category.toUpperCase()}</h3>`;
        chartsDiv.appendChild(div);
    });

    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Dicionário de cores para cada período
    const colorMap = {
        "pre_pandemia": "#5b9bd5",
        "pandemia": "#70ad47",
        "pos_pandemia": "#ed7d31"
    };

    const labelMap = {
        "pre_pandemia": "Pré-pandemia",
        "pandemia": "Pandemia",
        "pos_pandemia": "Pós-pandemia"
    }

    function createChart(stateData, category, elementId) {
        const svg = d3.select(`#${elementId}`)
            .append("svg")
            .attr("width", 800)
            .attr("height", 200);

        const periods = ["pre_pandemia", "pandemia", "pos_pandemia"];

        const values = category == 'total' ?
            sumFieldsPerPeriod(periods, stateData) :
            periods.map(p => stateData[p][category]);

        const x = d3.scaleBand()
            .range([0, 380])
            .domain(periods)
            .padding(0.1);

        const maxValue = Math.max(...values);
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .nice()
            .range([180, 0]);

        svg.append("g")
        .attr("transform", "translate(120,0)")
        .selectAll(".bar")
        .data(periods)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d))
        .attr("width", x.bandwidth())
        .attr("y", d => y(values[periods.indexOf(d)]))
        .attr("height", d => 180 - y(values[periods.indexOf(d)]))
        .attr("fill", d => colorMap[d]) // Define a cor inicial
        .on("mouseover", function(event, d) {
            const currentColor = d3.select(this).attr("fill");
            d3.select(this).attr("fill", d3.rgb(currentColor).darker(0.5)); // Escurece a cor atual
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(labelMap[d] + ": " + formatCurrency(stateData[d][category]))
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("fill", colorMap[d]); // Volta para a cor original
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        svg.append("g")
            .attr("transform", "translate(120,180)")
            .call(d3.axisBottom(x).tickFormat(d => labelMap[d]));

        svg.append("g")
            .attr("transform", "translate(120, 0)")
            .call(d3.axisLeft(y).tickFormat(d => formatCurrency(d)).ticks(5));
    }

    stateSelector.addEventListener('change', (e) => {
        const selectedState = e.target.value;
        categories.forEach(category => {
            d3.select(`#chart_${category}`).select("svg").remove(); // Limpa o SVG antigo
            createChart(data[selectedState], category, `chart_${category}`);
        });
    });

    // Inicializa com o primeiro estado
    if (states.length > 0) {
        stateSelector.value = states[0];
        stateSelector.dispatchEvent(new Event('change'));
    }
});