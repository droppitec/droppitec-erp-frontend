import { Component, OnInit } from '@angular/core';
import { ChartDataset, ChartOptions, ChartType, Chart as ChartJS } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {VentasMensuales} from "../../../models/comandos/dashboard/VentasMensuales.comando";
import {VentasService} from "../../../services/ventas.services";
import {ThemeCalidoService} from "../../../services/theme.service";

// Registra los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-ventas-mensuales',
  templateUrl: './ventas-mensuales.component.html',
  styleUrls: ['./ventas-mensuales.component.scss']
})
export class VentasMensualesComponent implements OnInit {

  public ventasMesuales: VentasMensuales[] = [];
  public buscando: boolean = false;
  private isDarkMode: boolean = false;

  constructor(private ventasService: VentasService, private themeService: ThemeCalidoService) {}

  ngOnInit() {
    this.buscarInfoTema();
    this.buscarCantidadVentasMensuales();
  }

  private buscarInfoTema() {
    this.themeService.darkMode$.subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

  private buscarCantidadVentasMensuales() {
    this.buscando = true;

    // Mapeo de meses en inglés a español
    const mesesEnEspanol: { [key: string]: string } = {
      January: 'Enero',
      February: 'Febrero',
      March: 'Marzo',
      April: 'Abril',
      May: 'Mayo',
      June: 'Junio',
      July: 'Julio',
      August: 'Agosto',
      September: 'Septiembre',
      October: 'Octubre',
      November: 'Noviembre',
      December: 'Diciembre'
    };

    this.ventasService.buscarCantidadVentasMensuales().subscribe((cantidadVentasMensuales) => {
      // Traducir los nombres de los meses
      this.ventasMesuales = cantidadVentasMensuales.map(venta => {
        if (!venta.mes) {
          console.warn("Registro con 'mes' inválido:", venta);
          return { ...venta, mes: "Fecha desconocida" };
        }

        // Separar mes y año, eliminando espacios extra
        const partes = venta.mes.split(/\s+/);
        if (partes.length < 2) {
          console.warn("Formato incorrecto en 'mes':", venta.mes);
          return { ...venta, mes: "Fecha desconocida" };
        }

        const [mes, anio] = partes;
        return {
          ...venta,
          mes: `${mesesEnEspanol[mes] || mes} ${anio}`
        };
      });

      this.barChartLabels = this.ventasMesuales.map(venta => venta.mes);
      this.barChartData[0].data = this.ventasMesuales.map(venta => venta.total);
      this.buscando = false;
    });
  }


  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 10,
          color: this.isDarkMode ? 'rgb(255,255,255)' : 'rgb(74,74,74)',
          font: {
            size: 10,
          },
          callback: (value) => {
            // Convierte el valor a un número
            const numericValue = Number(value);
            if (isNaN(numericValue)) {
              return '$ N/A';
            }

            // Formatea el número según la configuración regional
            const formattedValue = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(numericValue);

            return formattedValue;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.2)',
          lineWidth: 0.1,
        },
      },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: this.isDarkMode ? 'rgb(255,255,255)' : 'rgb(74,74,74)',
          padding: 5,
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.2)',
          lineWidth: 0.1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            // Asegura que context.raw es un número
            const value = Number(context.raw);
            if (isNaN(value)) {
              return ' Ventas: N/A';
            }

            // Formatea el número según la configuración regional
            const formattedValue = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);

            return `Ventas: ${formattedValue}`;
          },
        },
      },
    },
  };

  public barChartLabels: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  public barChartData: ChartDataset<'bar', number[]>[] = [
    {
      data: [],
      label: 'Ventas',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: {
        top: 3,
        right: 1,
        bottom: 1,
        left: 1
      }
    }
  ];

}
