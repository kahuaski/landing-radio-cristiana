interface Env {
	DB: D1Database;
}

type Origen =
	| "facebook"
	| "instagram"
	| "google"
	| "youtube"
	| "whatsapp"
	| "tiktok"
	| "twitter"
	| "linkedin"
	| "telegram"
	| "directo"
	| "otro";

const ORIGENES_VALIDOS: readonly Origen[] = [
	"facebook",
	"instagram",
	"google",
	"youtube",
	"whatsapp",
	"tiktok",
	"twitter",
	"linkedin",
	"telegram",
	"directo",
	"otro",
];

interface Totales {
	hoy: number;
	mes: number;
	total: number;
}

interface Respuesta {
	data: {
		hoy: number;
		mes: number;
		total: number;
		porOrigen: Record<string, Totales>;
		actualizado: string;
	} | null;
	error: { code: string; message: string } | null;
}

function json(body: Respuesta, status = 200): Response {
	const headers: Record<string, string> = {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
	};
	return new Response(JSON.stringify(body), { status, headers });
}

function normalizarOrigen(valor: unknown): Origen {
	if (typeof valor !== "string") return "otro";
	const limpio = valor.trim().toLowerCase().slice(0, 32);
	return (ORIGENES_VALIDOS as readonly string[]).includes(limpio)
		? (limpio as Origen)
		: "otro";
}

function fechaUTC(offsetDias = 0): string {
	const d = new Date(Date.now() + offsetDias * 86_400_000);
	return d.toISOString().slice(0, 10);
}

function inicioDeMesUTC(): string {
	return `${fechaUTC().slice(0, 7)}-01`;
}

/** Huella anónima: hash de IP + User-Agent + sal diaria (rota cada día). */
async function huella(request: Request, sal: string): Promise<string> {
	const ip =
		request.headers.get("CF-Connecting-IP") ??
		request.headers.get("x-forwarded-for") ??
		"0.0.0.0";
	const ua = request.headers.get("user-agent") ?? "desconocido";
	const datos = new TextEncoder().encode(`${ip}|${ua}|${sal}`);
	const hash = await crypto.subtle.digest("SHA-256", datos);
	return [...new Uint8Array(hash)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function obtenerTotales(env: Env): Promise<Respuesta["data"]> {
	const hoy = fechaUTC();
	const mes = inicioDeMesUTC();
	const { results } = await env.DB.prepare(
		`SELECT
			origen,
			SUM(CASE WHEN fecha = ?1 THEN 1 ELSE 0 END) AS hoy,
			SUM(CASE WHEN fecha >= ?2 THEN 1 ELSE 0 END) AS mes,
			COUNT(*) AS total
		FROM visitas
		GROUP BY origen
		ORDER BY total DESC`,
	)
		.bind(hoy, mes)
		.all<{ origen: string; hoy: number; mes: number; total: number }>();

	const porOrigen: Record<string, Totales> = {};
	let totalHoy = 0;
	let totalMes = 0;
	let total = 0;

	for (const fila of results) {
		const totales: Totales = {
			hoy: fila.hoy ?? 0,
			mes: fila.mes ?? 0,
			total: fila.total ?? 0,
		};
		porOrigen[fila.origen] = totales;
		totalHoy += totales.hoy;
		totalMes += totales.mes;
		total += totales.total;
	}

	return { hoy: totalHoy, mes: totalMes, total, porOrigen, actualizado: new Date().toISOString() };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
	try {
		return json({ data: await obtenerTotales(env), error: null });
	} catch {
		return json(
			{ data: null, error: { code: "DB_ERROR", message: "No se pudieron leer las visitas." } },
			500,
		);
	}
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	let cuerpo: unknown;
	try {
		cuerpo = await request.json();
	} catch {
		return json(
			{ data: null, error: { code: "INVALID_BODY", message: "Cuerpo JSON inválido." } },
			400,
		);
	}

	const origen = normalizarOrigen((cuerpo as { origen?: unknown })?.origen);
	const hoy = fechaUTC();

	try {
		const visitante = await huella(request, hoy);
		await env.DB.prepare(
			"INSERT OR IGNORE INTO visitas (fecha, origen, visitante) VALUES (?1, ?2, ?3)",
		)
			.bind(hoy, origen, visitante)
			.run();

		return json({ data: await obtenerTotales(env), error: null });
	} catch {
		return json(
			{ data: null, error: { code: "DB_ERROR", message: "No se pudo registrar la visita." } },
			500,
		);
	}
};
