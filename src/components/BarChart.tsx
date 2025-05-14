import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface BarChartProps {
  labels: string[]; // Rótulos para o eixo X
  data: number[]; // Dados para o gráfico
  title: string; // Título do gráfico
}

const BarChart: React.FC<BarChartProps> = ({ labels, data, title }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Se já houver um gráfico, destrua-o antes de criar um novo
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Criação do gráfico de barras
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: title,
              data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Cor de preenchimento das barras
              borderColor: 'rgba(75, 192, 192, 1)', // Cor das bordas das barras
              borderWidth: 1, // Largura das bordas
            },
          ],
        },
        options: {
          responsive: true, // Torna o gráfico responsivo
          plugins: {
            legend: {
              display: true,
              position: 'top', // Posiciona a legenda no topo
            },
            title: {
              display: true,
              text: title, // Adiciona o título ao gráfico
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Categorias', // Texto do eixo X
              },
            },
            y: {
              beginAtZero: true, // Começa o eixo Y no zero
              title: {
                display: true,
                text: 'Valores', // Texto do eixo Y
              },
            },
          },
        },
      });
    }

    // Cleanup para destruir o gráfico quando o componente for desmontado
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, data, title]);

  return <canvas ref={chartRef}></canvas>; // Canvas onde o gráfico será renderizado
};

export default BarChart;