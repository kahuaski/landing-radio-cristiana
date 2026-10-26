
export interface AdSpot {
	imagen?: string;
	href: string;
	alt: string;
	titulo: string;
	descripcion?: string;
}

export const AD_SPOTS: AdSpot[] = [
	{
		href: "https://www.facebook.com/61592469047508",
		alt: "Espacio publicitario: anuncia tu negocio en Radio Mushuk Kawsay",
		titulo: "Tu anuncio aquí",
		descripcion: "Llega a miles de oyentes. Escríbenos para conocer nuestras tarifas.",
		imagen: "/coop.jpeg",
	},
	{
		href: "https://www.facebook.com/mindalaerentacar/?locale=es_LA",
		alt: "Espacio publicitario: patrocina un programa de la radio",
		titulo: "Patrocina un programa",
		descripcion: "Asocia tu marca a la programación que inspira a nuestra comunidad.",
		imagen: "/rentacar.jpg",
	},
	{
		href: "https://www.facebook.com/funeraria.buena.esperanza.otavalo/",
		alt: "Espacio publicitario: promoción especial para iglesias y ministerios",
		titulo: "Promociones para ministerios",
		descripcion: "Tarifas especiales para iglesias, ministerios y eventos cristianos.",
		imagen: "/buenaesperanza.jpg",
	},
		{
		href: "https://www.facebook.com/p/Capital-Entidad-Financiera-61555958602183/",
		alt: "Espacio publicitario: promoción especial para iglesias y ministerios",
		titulo: "Promociones para ministerios",
		descripcion: "Tarifas especiales para iglesias, ministerios y eventos cristianos.",
		imagen: "/capital.jpeg",
	},
];
