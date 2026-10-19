/**
 * Spots publicitarios del carrusel de anuncios.
 *
 * ⚠️ Reemplaza cada `href`, `titulo`, `descripcion` y `imagen` por los reales.
 * Usa imágenes de 1200×300 px (relación 4:1) en /public o una URL externa.
 */
export interface AdSpot {
	/** Ruta o URL de la imagen del banner. Si se omite, se muestra el texto del spot. */
	imagen?: string;
	/** Enlace de destino del anuncio. */
	href: string;
	/** Texto alternativo de la imagen (obligatorio si hay `imagen`). */
	alt: string;
	/** Título del anuncio (se muestra si no hay imagen y como respaldo accesible). */
	titulo: string;
	/** Descripción corta del anuncio. */
	descripcion?: string;
}

export const AD_SPOTS: AdSpot[] = [
	{
		href: "/contacto",
		alt: "Espacio publicitario: anuncia tu negocio en Radio Mushuk Kawsay",
		titulo: "Tu anuncio aquí",
		descripcion: "Llega a miles de oyentes. Escríbenos para conocer nuestras tarifas.",
	},
	{
		href: "/contacto",
		alt: "Espacio publicitario: patrocina un programa de la radio",
		titulo: "Patrocina un programa",
		descripcion: "Asocia tu marca a la programación que inspira a nuestra comunidad.",
	},
	{
		href: "/contacto",
		alt: "Espacio publicitario: promoción especial para iglesias y ministerios",
		titulo: "Promociones para ministerios",
		descripcion: "Tarifas especiales para iglesias, ministerios y eventos cristianos.",
	},
];
