/**
 * Configuración de la playlist personal.
 *
 * ⚠️ Reemplaza `url` por el enlace real de tu playlist de YouTube.
 * Formato válido: https://www.youtube.com/playlist?list=XXXXXXXX
 */
export const PLAYLIST = {
	platform: "youtube" as const,
	title: "Alabanzas y adoración",
	subtitle: "Playlist personal",
	/** 👇 Cambia esto por tu playlist real */
	url: "https://www.youtube.com/playlist?list=PL_REPLACE_WITH_YOUR_PLAYLIST_ID",
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
