/**
 * Configuración de la playlist personal.
 *
 * ⚠️ Reemplaza `url` por el enlace real de tu playlist de YouTube.
 * Formato válido: https://www.youtube.com/playlist?list=XXXXXXXX
 */
// config/playlist.ts
export const PLAYLIST = {
    platform: "youtube" as const,
    title: "Alabanzas y adoración",
    subtitle: "Radio Ministerial Mushuk Kawsay", // Puedes poner el nombre de la radio aquí
    url: "https://youtube.com/playlist?list=PLqU3pqzUd_EiNwDrXBGfTJDWIHAwuF49P&si=D2y2gcOMxH02x0Yu",
};
 
/** Convierte la URL de una playlist de YouTube en su URL de embed. */
export function getPlaylistEmbedUrl(url: string = PLAYLIST.url): string {
	let listId = "";
	try {
		listId = new URL(url).searchParams.get("list") ?? "";
	} catch {
		listId = "";
	}
	const params = new URLSearchParams({
		list: listId,
		rel: "0",
		autoplay: "1",
	});
	return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
}
