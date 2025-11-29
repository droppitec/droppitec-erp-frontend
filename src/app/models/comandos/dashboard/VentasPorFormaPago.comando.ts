export class VentasPorFormaPago {
  formaPago: string;
  total: number;

  constructor(formaPago?: string, total?: number) {
    this.formaPago = formaPago!;
    this.total = total!;
  }
}

