import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {VentasService} from "../../../services/ventas.services";
import {UsuariosService} from "../../../services/usuarios.service";
import {FiltrosEmpleados} from "../../../models/comandos/FiltrosEmpleados.comando";
import {Subject, forkJoin} from "rxjs";
import {ProductosService} from "../../../services/productos.service";
import {ThemeCalidoService} from "../../../services/theme.service";
import { Chart, ChartOptions, registerables } from 'chart.js';
import {FiltrosEstadisticasVentas} from "../../../models/comandos/FiltrosEstadisticasVentas.comando";
import {Usuario} from "../../../models/usuario.model";

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
  empleadosCompletos: Usuario[] = []; // Para mapear nombre a ID
  public cargandoDatos: boolean = false;

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
      this.empleadosCompletos = empleados;
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
    this.cargarDatosGraficos();
  }

  private construirFiltros(): FiltrosEstadisticasVentas {
    const { start_date, end_date, payment_method, var_category, employee_name } = this.filtersForm.value;
    
    // Buscar el ID del empleado por nombre
    let idEmpleado: number | null = null;
    if (employee_name && employee_name !== '') {
      const empleado = this.empleadosCompletos.find(
        emp => (emp.nombre + ' ' + emp.apellido) === employee_name
      );
      idEmpleado = empleado?.id || null;
    }

    return new FiltrosEstadisticasVentas(
      start_date || null,
      end_date || null,
      payment_method || '',
      var_category || '',
      idEmpleado
    );
  }

  private cargarDatosGraficos(): void {
    this.cargandoDatos = true;
    const filtros = this.construirFiltros();

    forkJoin({
      formaPago: this.ventasService.obtenerVentasPorFormaPago(filtros),
      categoria: this.ventasService.obtenerVentasPorCategoria(filtros),
      hora: this.ventasService.obtenerVentasPorHora(filtros),
      empleados: this.ventasService.obtenerVentasPorEmpleado(filtros),
      clientes: this.ventasService.obtenerVentasPorCliente(filtros)
    }).subscribe({
      next: (datos) => {
        setTimeout(() => {
          this.crearGraficoFormaPago(datos.formaPago);
          this.crearGraficoCategoria(datos.categoria);
          this.crearGraficoFechaHora(datos.hora);
          this.crearGraficoEmpleados(datos.empleados);
          this.crearGraficoClientes(datos.clientes);
          this.cargandoDatos = false;
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar datos de gráficos:', error);
        this.cargandoDatos = false;
        // En caso de error, mostrar gráficos vacíos
        setTimeout(() => {
          this.crearGraficoFormaPago([]);
          this.crearGraficoCategoria([]);
          this.crearGraficoFechaHora([]);
          this.crearGraficoEmpleados([]);
          this.crearGraficoClientes([]);
        }, 100);
      }
    });
  }

  private crearGraficoFormaPago(datos: any[]): void {
    const canvas = document.getElementById('chartFormaPago') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartFormaPago) {
      this.chartFormaPago.destroy();
    }

    const labels = datos.map(item => item.formaPago);
    const values = datos.map(item => item.total);

    // Generar colores dinámicamente
    const colors = this.generarColores(datos.length);

    this.chartFormaPago = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          data: values.length > 0 ? values : [0],
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('doughnut')
    });
  }

  private crearGraficoCategoria(datos: any[]): void {
    const canvas = document.getElementById('chartCategoria') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartCategoria) {
      this.chartCategoria.destroy();
    }

    const labels = datos.map(item => item.categoria);
    const values = datos.map(item => item.total);

    this.chartCategoria = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          label: 'Ventas',
          data: values.length > 0 ? values : [0],
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

  private crearGraficoFechaHora(datos: any[]): void {
    const canvas = document.getElementById('chartFechaHora') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartFechaHora) {
      this.chartFechaHora.destroy();
    }

    // Ordenar por hora para mostrar correctamente
    const datosOrdenados = [...datos].sort((a, b) => {
      const horaA = parseInt(a.hora.split(':')[0]);
      const horaB = parseInt(b.hora.split(':')[0]);
      return horaA - horaB;
    });

    const labels = datosOrdenados.map(item => item.hora);
    const values = datosOrdenados.map(item => item.total);

    this.chartFechaHora = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          label: 'Ventas',
          data: values.length > 0 ? values : [0],
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

  private crearGraficoEmpleados(datos: any[]): void {
    const canvas = document.getElementById('chartEmpleados') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartEmpleados) {
      this.chartEmpleados.destroy();
    }

    const labels = datos.map(item => item.nombreCompleto);
    const values = datos.map(item => item.total);

    this.chartEmpleados = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          label: 'Ventas',
          data: values.length > 0 ? values : [0],
          backgroundColor: 'rgba(75,192,192,0.6)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('bar')
    });
  }

  private crearGraficoClientes(datos: any[]): void {
    const canvas = document.getElementById('chartClientes') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartClientes) {
      this.chartClientes.destroy();
    }

    const labels = datos.map(item => item.nombreCompleto);
    const values = datos.map(item => item.total);

    this.chartClientes = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          label: 'Ventas',
          data: values.length > 0 ? values : [0],
          backgroundColor: 'rgba(153,102,255,0.6)',
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('bar')
    });
  }

  private generarColores(cantidad: number): { backgroundColor: string[], borderColor: string[] } {
    const coloresBase = [
      { bg: 'rgba(246,121,86,0.8)', border: 'rgba(246,121,86,1)' },
      { bg: 'rgba(54,162,235,0.8)', border: 'rgba(54,162,235,1)' },
      { bg: 'rgba(255,206,86,0.8)', border: 'rgba(255,206,86,1)' },
      { bg: 'rgba(75,192,192,0.8)', border: 'rgba(75,192,192,1)' },
      { bg: 'rgba(153,102,255,0.8)', border: 'rgba(153,102,255,1)' },
      { bg: 'rgba(255,99,132,0.8)', border: 'rgba(255,99,132,1)' },
      { bg: 'rgba(201,203,207,0.8)', border: 'rgba(201,203,207,1)' },
      { bg: 'rgba(255,159,64,0.8)', border: 'rgba(255,159,64,1)' }
    ];

    const backgroundColor: string[] = [];
    const borderColor: string[] = [];

    for (let i = 0; i < cantidad; i++) {
      const color = coloresBase[i % coloresBase.length];
      backgroundColor.push(color.bg);
      borderColor.push(color.border);
    }

    return { backgroundColor, borderColor };
  }

  private actualizarGraficos(): void {
    // Recargar datos cuando cambian los filtros o el tema
    this.cargarDatosGraficos();
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
