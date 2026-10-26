/**
 * Enlaces a las redes sociales de la radio.
 *
 * ⚠️ Reemplaza cada `url` y `handle` por los reales. El `color` es el color
 * de marca que se usa para el icono (compatible con claro y oscuro).
 */
export type SocialNetwork = "facebook" | "telegram" | "youtube" | "tiktok";

export interface SocialLink {
	red: SocialNetwork;
	label: string;
	handle: string;
	url: string;
	color: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
	{
		red: "facebook",
		label: "Facebook",
		handle: "/RadioMushukKawsay",
		url: "https://www.facebook.com/profile.php?id=61550567526478",
		color: "#1877f2",
	},
	{
		red: "tiktok",
		label: "TikTok",
		handle: "@mushukkawsay",
		url: "https://www.tiktok.com/@REEMPLAZA_TU_USUARIO",
		color: "#ffffff",
	},
	{
		red: "youtube",
		label: "YouTube",
		handle: "@MushukKawsay",
		url: "https://www.youtube.com/@kahuaski",
		color: "#ff0000",
	},
	{
		red: "telegram",
		label: "Telegram",
		handle: "+593 967 198 899",
		url: "https://t.me/+593967198899",
		color: "#26a5e4",
	},
];
