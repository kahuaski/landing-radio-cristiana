/**
 * Configuración de fuentes multimedia.
 *
 * ⚠️ Reemplaza las URLs por las reales:
 *  - `live`   → video o emisión en vivo de YouTube.
 *  - `music`  → playlist de YouTube con la música.
 *  - `videos` → playlist de YouTube con predicaciones/videos.
 */
export type MediaKind = "live" | "music" | "videos";

export interface MediaSource {
	kind: MediaKind;
	label: string;
	title: string;
	subtitle: string;
	url: string;
	live?: boolean;
}

export const MEDIA: Record<MediaKind, MediaSource> = {
	live: {
		kind: "live",
		label: "En vivo",
		title: "Transmisión en vivo",
		subtitle: "Cultos, servicios y programación especial",
		// ⚠️ URL del directo. Ejemplos válidos:
		//   https://www.youtube.com/live/VIDEO_ID
		//   https://www.youtube.com/watch?v=VIDEO_ID
		//   https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
		url: "https://www.youtube.com/live/REPLACE_LIVE_VIDEO_ID",
		live: true,
	},
	music: {
		kind: "music",
		label: "Música",
		title: "Alabanzas y adoración",
		subtitle: "Radio Ministerial Mushuk Kawsay",
		url: "https://youtube.com/playlist?list=PLqU3pqzUd_EiNwDrXBGfTJDWIHAwuF49P&si=D2y2gcOMxH02x0Yu",
	},
	videos: {
		kind: "videos",
		label: "Videos",
		title: "Predicaciones y mensajes",
		subtitle: "Radio Ministerial Mushuk Kawsay",
		// ⚠️ Reemplaza por tu playlist de videos.
		url: "https://www.youtube.com/watch?v=q0dVxPI9fwI&list=RDq0dVxPI9fwI&start_radio=1",
	},
};

/** Orden en que aparecen las pestañas del reproductor. */
export const MEDIA_ORDER: MediaKind[] = ["live", "music", "videos"];

/** Convierte una URL de YouTube (video, playlist o directo) en su URL de embed. */
export function getEmbedUrl(url: string): string {
	const params = new URLSearchParams({
		rel: "0",
		autoplay: "1",
		modestbranding: "1",
		playsinline: "1",
	});

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return "";
	}

	const host = parsed.hostname.replace(/^www\./, "");

	// youtu.be/VIDEO_ID
	if (host === "youtu.be") {
		const id = parsed.pathname.slice(1);
		return id ? `https://www.youtube.com/embed/${id}?${params}` : url;
	}

	const list = parsed.searchParams.get("list");
	const video = parsed.searchParams.get("v");
	const channel = parsed.searchParams.get("channel");

	// Directo por canal: embed/live_stream?channel=CHANNEL_ID
	if (channel || parsed.pathname.includes("live_stream")) {
		const suffix = channel ? `?channel=${channel}&${params}` : `?${params}`;
		return `https://www.youtube.com/embed/live_stream${suffix}`;
	}

	// Video suelto: watch?v=ID
	if (video) {
		return `https://www.youtube.com/embed/${video}?${params}`;
	}

	// Playlist: playlist?list=ID
	if (list) {
		return `https://www.youtube.com/embed/videoseries?list=${list}&${params}`;
	}

	// Rutas directas: /live/ID, /embed/ID, /shorts/ID
	const match = parsed.pathname.match(/\/(?:live|embed|shorts)\/([^/?#]+)/);
	if (match) {
		return `https://www.youtube.com/embed/${match[1]}?${params}`;
	}

	return url;
}
