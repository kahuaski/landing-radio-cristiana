-- Contador público de visitas por origen.
-- Una fila por visitante único por día (dedupe por fecha + huella), así una
-- recarga o varias visitas del mismo navegador el mismo día no inflan el conteo.
CREATE TABLE IF NOT EXISTS visitas (
	fecha     TEXT NOT NULL, -- 'YYYY-MM-DD' (UTC)
	origen    TEXT NOT NULL, -- 'facebook' | 'instagram' | 'google' | ... | 'directo' | 'otro'
	visitante TEXT NOT NULL, -- huella anónima (hash de IP + User-Agent + sal diaria)
	PRIMARY KEY (fecha, visitante)
);

-- Acelera los GROUP BY origen y los filtros por fecha.
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas (fecha);
CREATE INDEX IF NOT EXISTS idx_visitas_origen ON visitas (origen);
