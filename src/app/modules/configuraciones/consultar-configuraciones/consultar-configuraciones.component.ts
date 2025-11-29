import {Component, OnInit} from '@angular/core';
import {Form, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { SnackBarService } from "../../../services/snack-bar.service";
import {ConfiguracionesService} from "../../../services/configuraciones.service";
import {Configuracion} from "../../../models/configuracion.model";
import {NotificationService} from "../../../services/notificacion.service";
import {Usuario} from "../../../models/usuario.model";

@Component({
  selector: 'app-consultar-configuraciones',
  templateUrl: './consultar-configuraciones.component.html',
  styleUrl: './consultar-configuraciones.component.scss'
})
export class ConsultarConfiguracionesComponent implements OnInit {

  public form: FormGroup;
  public esSuperusuario: boolean = false;
  public configuracion: Configuracion = new Configuracion();
  public isLoading = false;
  public isSearchingConfiguration: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notificacionService: SnackBarService,
    private notificationDialogService: NotificationService,
    private configuracionesService: ConfiguracionesService,
  ) {
    this.form = new FormGroup({});
  }

  ngOnInit() {
    this.crearFormulario();
    this.buscarConfiguracion();
  }

  private crearFormulario() {
    this.form = this.fb.group({
      idUsuario: [{ value: '', disabled: true }],
      nombreUsuario: [{ value: '', disabled: true }],
      razonSocial: ['', [Validators.required]],
      calle: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
      codigoPostal: ['', [Validators.required]],
      cuit: [''],
      fechaInicioActividades: [''],
      condicionIva: [''],
      contrasenaInstagram: [''],
      usuarioInstagram: [''],
      facturacionAutomatica: [''],
      txMontoConsumidorFinal: ['', [Validators.required]]
    });
  }

  private buscarConfiguracion() {
    this.isSearchingConfiguration = true;
    this.configuracionesService.consultarConfiguraciones().subscribe({
      next: (configuracion) => {
        this.configuracion = configuracion;

        this.form.patchValue({
          idUsuario: configuracion.idUsuario,
          nombreUsuario: configuracion.usuario.nombreUsuario,
          razonSocial: configuracion.razonSocial,
          calle: configuracion.calle,
          numero: configuracion.numero,
          ciudad: configuracion.ciudad,
          provincia: configuracion.provincia,
          codigoPostal: configuracion.codigoPostal,
          cuit: configuracion.cuit,
          fechaInicioActividades: configuracion.fechaInicioActividades,
          condicionIva: configuracion.condicionIva,
          contrasenaInstagram: configuracion.contrasenaInstagram,
          usuarioInstagram: configuracion.usuarioInstagram,
          facturacionAutomatica: configuracion.facturacionAutomatica,
          txMontoConsumidorFinal: configuracion.montoConsumidorFinal
        });
        this.isSearchingConfiguration = false;
      },
      error: (err) => {
        console.error('Error al consultar la configuración:', err);
        this.isSearchingConfiguration = false;
        this.notificacionService.openSnackBarError('Error al cargar la configuración. Intente nuevamente.');
      }
    });
  }


  // Método que se ejecuta al dar click al botón de guardar
  public guardarConfiguracion() {
    if (this.form.valid) {
      const configuracion = this.crearConfiguracionDesdeFormulario();
      this.actualizarConfiguracion(configuracion);
    }
  }

  private crearConfiguracionDesdeFormulario(): Configuracion {
    return new Configuracion(
      this.configuracion.id,
      this.configuracion.idUsuario,
      this.razonSocial.value,
      this.cuit.value,
      this.fechaInicioActividades.value,
      this.condicionIva.value,
      this.configuracion.logo, // Mantener el logo existente
      this.contrasenaInstagram.value,
      this.usuarioInstagram.value,
      this.configuracion.usuario = new Usuario(),
      this.calle.value,
      this.numero.value,
      this.ciudad.value,
      this.provincia.value,
      this.codigoPostal.value,
      this.facturacionAutomatica.value,
      this.txMontoConsumidorFinal.value
    );
  }

  private actualizarConfiguracion(configuracion: Configuracion) {
    this.notificationDialogService.confirmation("¿Desea modificar la configuración?", "Modificar configuración")
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isLoading = true;
          this.configuracionesService.modificarConfiguracion(configuracion).subscribe({
            next: (respuesta) => {
              this.isLoading = false;

              if (respuesta.mensaje === 'OK') {
                this.notificacionService.openSnackBarSuccess('La configuración se modificó con éxito');
                window.location.reload();
              } else {
                this.notificacionService.openSnackBarError('Error al modificar la configuración, inténtelo nuevamente');
              }
            },
            error: (error) => {
              this.isLoading = false;
              this.notificacionService.openSnackBarError('Error al modificar la configuración, inténtelo nuevamente');
            }
          });
        }
      });
  }



  // Getters
  get idUsuario(): FormControl {
    return this.form.get('idUsuario') as FormControl;
  }

  get nombreUsuario(): FormControl {
    return this.form.get('nombreUsuario') as FormControl;
  }

  get razonSocial(): FormControl {
    return this.form.get('razonSocial') as FormControl;
  }

  get calle(): FormControl {
    return this.form.get('calle') as FormControl;
  }

  get numero(): FormControl {
    return this.form.get('numero') as FormControl;
  }

  get ciudad(): FormControl {
    return this.form.get('ciudad') as FormControl;
  }

  get provincia(): FormControl {
    return this.form.get('provincia') as FormControl;
  }

  get codigoPostal(): FormControl {
    return this.form.get('codigoPostal') as FormControl;
  }

  get cuit(): FormControl {
    return this.form.get('cuit') as FormControl;
  }

  get fechaInicioActividades(): FormControl {
    return this.form.get('fechaInicioActividades') as FormControl;
  }

  get condicionIva(): FormControl {
    return this.form.get('condicionIva') as FormControl;
  }

  get contrasenaInstagram(): FormControl {
    return this.form.get('contrasenaInstagram') as FormControl;
  }

  get usuarioInstagram(): FormControl {
    return this.form.get('usuarioInstagram') as FormControl;
  }

  get facturacionAutomatica(): FormControl {
    return this.form.get('facturacionAutomatica') as FormControl;
  }

  get txMontoConsumidorFinal(): FormControl {
    return this.form.get('txMontoConsumidorFinal') as FormControl;
  }

}

