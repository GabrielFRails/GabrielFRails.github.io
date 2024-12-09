// Função para carregar o JSON
async function loadJson() {
    const response = await fetch('./../credito_contratacao_contratado_pf_linha_estado.json');
    return await response.json();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 0,
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value);
}

const sumFieldsPerPeriod = (periods, data) =>
    periods.map(period =>
        Object.values(data[period]).reduce((sum, value) => sum + value, 0)
    );

function highlightState(selectedState) {
    d3.select(`#line-chart`).select("svg").selectAll('path')
        .attr('stroke-width', function() {
            const state = d3.select(this).attr('state');
            return state === selectedState ? 4 : 1;
        })
}
    
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

    const chartsDiv = document.getElementById('bar-charts');

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

    const periods = ["pre_pandemia", "pandemia", "pos_pandemia"];

    function createBarChart(stateData, category, elementId) {
        const svg = d3.select(`#${elementId}`)
            .append("svg")
            .attr("width", 800)
            .attr("height", 200);

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
            tooltip.html(labelMap[d] + ": " + formatCurrency(values[periods.indexOf(d)]))
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

    function createLineChart() {
        const values = states.map(s => {
            return {
                state: s.toUpperCase(), // Convertendo siglas para uppercase
                values: sumFieldsPerPeriod(periods, data[s])
            };
        });
    
        const svg = d3.select(`#line-chart`)
            .append("svg")
            .attr("width", 900)
            .attr("height", 700); // Aumentei a altura do gráfico
    
        const margin = { top: 20, right: 70, bottom: 90, left: 70 };
        const width = 900 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;
    
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        // Escala X
        const x = d3.scalePoint()
            .range([0, width])
            .domain(periods);
    
        // Escala Y (Logarítmica para melhor distribuição)
        const maxValue = d3.max(values.flatMap(d => d.values));
        const minValue = d3.min(values.flatMap(d => d.values));
        const y = d3.scaleLog()
            .base(10)
            .domain([minValue, maxValue]) // O valor mínimo de 1 evita problemas com log(0)
            .range([height, 0])
            .nice();
    
        // Adicionar eixo X
        g.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d => labelMap[d]))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");
    
        // Adicionar eixo Y com formatação compacta
        g.append('g')
            .call(d3.axisLeft(y).tickFormat(d => formatCurrency(d)).ticks(5)); // Notação compacta para valores grandes
    
        // Desenhando as linhas segmentadas
        values.forEach(d => {
            const lineData = d.values;
    
            for (let i = 0; i < lineData.length - 1; i++) {
                const segment = [lineData[i], lineData[i + 1]];
    
                g.append("path")
                    .datum(segment)
                    .attr("d", d3.line()
                        .x((_, j) => x(periods[i + j]))
                        .y(v => y(v))
                    )
                    .attr("fill", "none")
                    .attr("stroke", segment[1] > segment[0] ? "green" : "orange")
                    .attr("stroke-width", 1)
                    .attr("state", d.state);
            }
        });
    
        // Adicionando labels para os estados
        values.forEach(d => {
            g.append("text")
                .attr("x", x(periods[periods.length - 1]) + 5) // Corrigido o cálculo para posicionar o texto corretamente
                .attr("y", y(d.values[periods.length - 1]))
                .attr("dy", "0.35em")
                .text(d.state)
                .style("font-size", "10px")
                .style("fill", "black");
        });
    }    

    stateSelector.addEventListener('change', (e) => {
        const selectedState = e.target.value;
        categories.forEach(category => {
            d3.select(`#chart_${category}`).select("svg").remove(); // Limpa o SVG antigo
            createBarChart(data[selectedState], category, `chart_${category}`);
        });
        highlightState(selectedState.toUpperCase())
    });

    // Inicializa com o primeiro estado
    if (states.length > 0) {
        stateSelector.value = states[0];
        createLineChart()
        stateSelector.dispatchEvent(new Event('change'));
    }
});