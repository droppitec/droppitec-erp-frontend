import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {VentasService} from "../../../services/ventas.services";
import {UsuariosService} from "../../../services/usuarios.service";
import {FiltrosEmpleados} from "../../../models/comandos/FiltrosEmpleados.comando";
import {Subject} from "rxjs";
import {ProductosService} from "../../../services/productos.service";
import {ThemeCalidoService} from "../../../services/theme.service";
import { Chart, ChartOptions, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-visualizaciones-ventas',
  templateUrl: './visualizaciones-ventas.component.html',
  styleUrls: ['./visualizaciones-ventas.component.scss'],
})
export class VisualizacionesVentasComponent implements OnInit, OnDestroy {
  filtersForm: FormGroup;
  public darkMode: boolean = false;
  public maxDate: Date;
  private dataLoaded$ = new Subject<boolean>();

  paymentMethods: string[] = [];
  categories: string[] = [];
  employees: string[] = [];

  // Datos hardcodeados para los gráficos
  private datosHardcodeados = {
    formaPago: {
      labels: ['Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Transferencia', 'Mercado Pago'],
      data: [45000, 32000, 28000, 15000, 12000]
    },
    categoria: {
      labels: ['Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Juguetes'],
      data: [55000, 42000, 38000, 25000, 18000, 15000]
    },
    fechaHora: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      data: [5000, 3000, 15000, 25000, 22000, 18000]
    },
    empleados: {
      labels: ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Pedro Rodríguez'],
      data: [35000, 32000, 28000, 25000, 20000]
    },
    clientes: {
      labels: ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D', 'Cliente E', 'Cliente F'],
      data: [28000, 25000, 22000, 20000, 18000, 15000]
    }
  };

  // Configuración de gráficos
  public chartFormaPago: any;
  public chartCategoria: any;
  public chartFechaHora: any;
  public chartEmpleados: any;
  public chartClientes: any;

  constructor(
    private fb: FormBuilder,
    private ventasService: VentasService,
    private usuariosService: UsuariosService,
    private productosService: ProductosService,
    private themeService: ThemeCalidoService) {
    this.filtersForm = this.fb.group({
      start_date: [null],
      end_date: [null],
      payment_method: [''],
      var_category: [''],
      employee_name: [''],
    });
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.obtenerInformacionTema();
    this.buscarDatosCombo();
    this.themeService.darkMode$.subscribe((isDarkMode) => {
      this.darkMode = isDarkMode;
      this.actualizarGraficos();
    });
  }

  obtenerInformacionTema() {
    this.darkMode = this.themeService.isDarkMode();
  }

  private buscarDatosCombo() {
    // Crear un contador para llevar la cuenta de las suscripciones completadas
    let completedSubscriptions = 0;
    const totalSubscriptions = 3;

    this.usuariosService.consultarEmpleados(new FiltrosEmpleados()).subscribe((empleados) => {
      this.employees = empleados.map((empleado) => empleado.nombre + ' ' + empleado.apellido);
      completedSubscriptions++;
      if (completedSubscriptions === totalSubscriptions) {
        this.dataLoaded$.next(true);
      }
    });

    this.ventasService.buscarFormasDePago().subscribe((formasPago) => {
      this.paymentMethods = formasPago.map((formaPago) => formaPago.nombre);
      completedSubscriptions++;
      if (completedSubscriptions === totalSubscriptions) {
        this.dataLoaded$.next(true);
      }
    });

    this.productosService.buscarTiposProductos().subscribe((categorias) => {
      this.categories = categorias.map((categoria) => categoria.nombre);
      completedSubscriptions++;
      if (completedSubscriptions === totalSubscriptions) {
        this.dataLoaded$.next(true);
      }
    });

    // Suscribirse al Subject para ejecutar actualizarGraficos() cuando todas las suscripciones se completen
    this.dataLoaded$.subscribe(() => {
      this.crearGraficos();
      this.filtersForm.valueChanges.subscribe(() => this.actualizarGraficos());
    });
  }

  private getChartOptions(type: 'bar' | 'line' | 'pie' | 'doughnut'): ChartOptions {
    const textColor = this.darkMode ? 'rgb(255,255,255)' : 'rgb(74,74,74)';
    const gridColor = this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: textColor,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw);
              const formattedValue = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
              return `${context.label}: ${formattedValue}`;
            }
          }
        }
      }
    };

    if (type === 'bar' || type === 'line') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (value) => {
                const numericValue = Number(value);
                return new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(numericValue);
              }
            },
            grid: {
              color: gridColor,
              lineWidth: 0.5
            }
          },
          x: {
            ticks: {
              color: textColor,
              font: { size: 10 }
            },
            grid: {
              color: gridColor,
              lineWidth: 0.5
            }
          }
        }
      };
    }

    return baseOptions;
  }

  private crearGraficos(): void {
    setTimeout(() => {
      this.crearGraficoFormaPago();
      this.crearGraficoCategoria();
      this.crearGraficoFechaHora();
      this.crearGraficoEmpleados();
      this.crearGraficoClientes();
    }, 100);
  }

  private crearGraficoFormaPago(): void {
    const canvas = document.getElementById('chartFormaPago') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartFormaPago) {
      this.chartFormaPago.destroy();
    }

    this.chartFormaPago = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.datosHardcodeados.formaPago.labels,
        datasets: [{
          data: this.datosHardcodeados.formaPago.data,
          backgroundColor: [
            'rgba(246,121,86,0.8)',
            'rgba(54,162,235,0.8)',
            'rgba(255,206,86,0.8)',
            'rgba(75,192,192,0.8)',
            'rgba(153,102,255,0.8)'
          ],
          borderColor: [
            'rgba(246,121,86,1)',
            'rgba(54,162,235,1)',
            'rgba(255,206,86,1)',
            'rgba(75,192,192,1)',
            'rgba(153,102,255,1)'
          ],
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('doughnut')
    });
  }

  private crearGraficoCategoria(): void {
    const canvas = document.getElementById('chartCategoria') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartCategoria) {
      this.chartCategoria.destroy();
    }

    this.chartCategoria = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosHardcodeados.categoria.labels,
        datasets: [{
          label: 'Ventas',
          data: this.datosHardcodeados.categoria.data,
          backgroundColor: 'rgba(246,121,86,0.6)',
          borderColor: 'rgba(246,121,86,1)',
          borderWidth: 2
        }]
      },
      options: {
        ...this.getChartOptions('bar'),
        indexAxis: 'y'
      }
    });
  }

  private crearGraficoFechaHora(): void {
    const canvas = document.getElementById('chartFechaHora') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartFechaHora) {
      this.chartFechaHora.destroy();
    }

    this.chartFechaHora = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.datosHardcodeados.fechaHora.labels,
        datasets: [{
          label: 'Ventas',
          data: this.datosHardcodeados.fechaHora.data,
          borderColor: 'rgba(54,162,235,1)',
          backgroundColor: 'rgba(54,162,235,0.2)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: this.getChartOptions('line')
    });
  }

  private crearGraficoEmpleados(): void {
    const canvas = document.getElementById('chartEmpleados') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartEmpleados) {
      this.chartEmpleados.destroy();
    }

    this.chartEmpleados = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosHardcodeados.empleados.labels,
        datasets: [{
          label: 'Ventas',
          data: this.datosHardcodeados.empleados.data,
          backgroundColor: 'rgba(75,192,192,0.6)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('bar')
    });
  }

  private crearGraficoClientes(): void {
    const canvas = document.getElementById('chartClientes') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartClientes) {
      this.chartClientes.destroy();
    }

    this.chartClientes = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.datosHardcodeados.clientes.labels,
        datasets: [{
          label: 'Ventas',
          data: this.datosHardcodeados.clientes.data,
          backgroundColor: 'rgba(153,102,255,0.6)',
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('bar')
    });
  }

  private actualizarGraficos(): void {
    if (this.chartFormaPago) {
      this.chartFormaPago.options = this.getChartOptions('doughnut');
      this.chartFormaPago.update();
    }
    if (this.chartCategoria) {
      this.chartCategoria.options = this.getChartOptions('bar');
      this.chartCategoria.update();
    }
    if (this.chartFechaHora) {
      this.chartFechaHora.options = this.getChartOptions('line');
      this.chartFechaHora.update();
    }
    if (this.chartEmpleados) {
      this.chartEmpleados.options = this.getChartOptions('bar');
      this.chartEmpleados.update();
    }
    if (this.chartClientes) {
      this.chartClientes.options = this.getChartOptions('bar');
      this.chartClientes.update();
    }
  }

  limpiarFiltros() {
    this.filtersForm.reset();
    this.filtersForm.patchValue({
      start_date: null,
      end_date: null,
      payment_method: '',
      var_category: '',
      employee_name: '',
    });
    // Los gráficos se actualizan automáticamente por valueChanges
  }

  ngOnDestroy(): void {
    if (this.chartFormaPago) this.chartFormaPago.destroy();
    if (this.chartCategoria) this.chartCategoria.destroy();
    if (this.chartFechaHora) this.chartFechaHora.destroy();
    if (this.chartEmpleados) this.chartEmpleados.destroy();
    if (this.chartClientes) this.chartClientes.destroy();
  }

  get txFechaDesde(): FormControl {
    return this.filtersForm.get('start_date') as FormControl;
  }
}
