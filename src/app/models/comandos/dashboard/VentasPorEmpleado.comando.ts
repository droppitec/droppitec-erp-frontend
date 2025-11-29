export class VentasPorEmpleado {
  idEmpleado: number;
  nombreCompleto: string;
  total: number;

  constructor(idEmpleado?: number, nombreCompleto?: string, total?: number) {
    this.idEmpleado = idEmpleado!;
    this.nombreCompleto = nombreCompleto!;
    this.total = total!;
  }
}

