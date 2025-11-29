export class VentasPorCategoria {
  categoria: string;
  total: number;

  constructor(categoria?: string, total?: number) {
    this.categoria = categoria!;
    this.total = total!;
  }
}

