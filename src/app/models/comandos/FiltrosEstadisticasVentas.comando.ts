export class FiltrosEstadisticasVentas {
  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
  formaDePago?: string;  // nombre de la forma de pago o vacío para todas
  categoria?: string;   // nombre de la categoría o vacío para todas
  idEmpleado?: number | null;  // ID del empleado o null para todos

  constructor(
    fechaDesde?: Date | null,
    fechaHasta?: Date | null,
    formaDePago?: string,
    categoria?: string,
    idEmpleado?: number | null
  ) {
    this.fechaDesde = fechaDesde;
    this.fechaHasta = fechaHasta;
    this.formaDePago = formaDePago;
    this.categoria = categoria;
    this.idEmpleado = idEmpleado;
  }
}

