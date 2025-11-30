export class VentasPorCliente {
  idCliente: number;
  nombreCompleto: string;
  total: number;

  constructor(idCliente?: number, nombreCompleto?: string, total?: number) {
    this.idCliente = idCliente!;
    this.nombreCompleto = nombreCompleto!;
    this.total = total!;
  }
}

