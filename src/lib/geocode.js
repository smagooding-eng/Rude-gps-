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
      category: categorize(p),
    };
  });
}

// Rough destination category from OpenStreetMap tags, for destination-specific jokes.
const BY_VALUE = {
  fast_food: 'fastfood', cafe: 'coffee', bar: 'bar', pub: 'bar', nightclub: 'bar', biergarten: 'bar',
  restaurant: 'restaurant', fitness_centre: 'gym', sports_centre: 'gym',
  supermarket: 'superstore', department_store: 'superstore', wholesale: 'superstore', mall: 'mall',
  fuel: 'gas', car_wash: 'carwash', bank: 'bank', atm: 'bank', townhall: 'government', courthouse: 'government',
  hospital: 'medical', clinic: 'medical', doctors: 'medical', dentist: 'medical', pharmacy: 'medical', chemist: 'medical',
  place_of_worship: 'worship', grave_yard: 'respect', cemetery: 'respect', funeral_hall: 'respect', funeral_directors: 'respect',
  school: 'school', university: 'school', college: 'school', aerodrome: 'airport', terminal: 'airport',
  casino: 'casino', alcohol: 'liquor', beach: 'beach', park: 'park', hotel: 'hotel', motel: 'hotel',
  cinema: 'movies', library: 'library', zoo: 'zoo', car: 'dealership', hairdresser: 'haircut', police: 'police',
};

export function categorize(p) {
  if (p.osm_key === 'office' && p.osm_value === 'government') return 'government';
  if (p.osm_key === 'office') return 'work';
  if (p.osm_key === 'emergency') return 'medical';
  const name = (p.name || '').toLowerCase();
  if (/\b(dmv|motor vehicle|secretary of state)\b/.test(name)) return 'government';
  if (/\b(emergency room|urgent care|hospital)\b/.test(name)) return 'medical';
  return BY_VALUE[p.osm_value] || (p.osm_key === 'place' || p.osm_key === 'highway' || p.osm_key === 'building' ? 'address' : 'other');
}
