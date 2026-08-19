import { Component } from '@angular/core';

interface FooterColumn {
  title: string;
  links: string[];
}

const COLUMNS: FooterColumn[] = [
  { title: 'Recursos', links: ['Encuentra una tienda', 'Guía de tallas', 'Estado del pedido', 'Devoluciones'] },
  { title: 'Ayuda', links: ['Contáctanos', 'Preguntas frecuentes', 'Envíos', 'Métodos de pago'] },
  { title: 'Compañía', links: ['Sobre STRIDE', 'Noticias', 'Sostenibilidad', 'Empleo'] },
  { title: 'Promociones', links: ['Ofertas', 'Programa de membresía', 'Tarjetas de regalo'] },
];

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  protected readonly columns = COLUMNS;
  protected readonly year = new Date().getFullYear();
}
