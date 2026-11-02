// Place search via Photon (OpenStreetMap data, no key).
const PHOTON = 'https://photon.komoot.io/api/';

export async function searchPlaces(q, near, signal) {
  const params = new URLSearchParams({ q, limit: '6', lang: 'en' });
  if (near) {
    params.set('lat', String(near[1]));
    params.set('lon', String(near[0]));
  }
  const res = await fetch(`${PHOTON}?${params}`, { signal });
  if (!res.ok) throw new Error(`Search error (${res.status})`);
  const data = await res.json();
  return (data.features || []).map((f, i) => {
    const p = f.properties || {};
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const name = p.name || street || p.city || 'Unnamed place';
    const parts = [street !== name ? street : '', p.city || p.town || p.village, p.state, p.country]
      .filter(Boolean)
      .filter((v, idx, arr) => arr.indexOf(v) === idx && v !== name);
    return {
      id: `${p.osm_type || ''}${p.osm_id || i}`,
      name,
      label: parts.join(', '),
      coords: f.geometry.coordinates,
    };
  });
}
