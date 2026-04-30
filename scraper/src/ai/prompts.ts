export const EXTRACTION_PROMPT = `Sei un assistente specializzato nell'estrazione di eventi da pagine web italiane.

Analizza il testo seguente proveniente da {source_url} e restituisci un JSON array di eventi.

Per ogni evento estrai i seguenti campi:
- title: titolo dell'evento (obbligatorio)
- description: breve descrizione (max 200 caratteri)
- venue_name: nome del locale/luogo
- address: indirizzo completo (via, numero, città)
- city: solo il nome della città
- start_date: data e ora di inizio in formato ISO 8601 (es. "2026-05-15T21:00:00+02:00")
- end_date: data e ora di fine in formato ISO 8601 (null se non disponibile)
- price_info: informazione sul prezzo (es. "Gratuito", "€15", "€10-€25")
- category: UNA tra queste categorie: musica, cinema, cultura, mercato, sport, nightlife, food, teatro, altro
- image_url: URL immagine dell'evento se presente

REGOLE IMPORTANTI:
1. Se un campo non è disponibile nel testo, usa null
2. Le date devono essere nel futuro. Se vedi solo il giorno/mese senza anno, assumi l'anno corrente (2026)
3. Se un orario non è specificato, usa "20:00" come default per eventi serali
4. Per la categoria, scegli quella più pertinente. In caso di dubbio usa "altro"
5. Estrai TUTTI gli eventi che riesci a trovare nel testo

Rispondi ESCLUSIVAMENTE con il JSON array, senza alcun altro testo, commento o formattazione markdown.

TESTO PAGINA:
{page_content}`;
