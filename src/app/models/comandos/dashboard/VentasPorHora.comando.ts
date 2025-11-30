export class VentasPorHora {
  hora: string;
  total: number;

  constructor(hora?: string, total?: number) {
    this.hora = hora!;
    this.total = total!;
  }
}

