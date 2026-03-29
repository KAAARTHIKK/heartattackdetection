import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const selectedIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center]);
  return null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchHospitals(lat, lon) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:5000,${lat},${lon});
      node["amenity"="clinic"](around:5000,${lat},${lon});
      node["healthcare"="hospital"](around:5000,${lat},${lon});
    );
    out body;
  `;
  const res  = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
  const data = await res.json();
  return data.elements || [];
}

function mapsLink(lat, lon, name) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;
}

const FILTER_CHIPS = [
  { label: 'Cardiology Dept', tag: 'cardiology' },
  { label: 'Cardiac ICU',     tag: 'cardiac_icu' },
  { label: 'Cath Lab',        tag: 'cath_lab' },
];

export default function HospitalFinder() {
  const [position,   setPosition]   = useState(null);
  const [hospitals,  setHospitals]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [activeChips, setActiveChips] = useState([]);

  function toggleChip(tag) {
    setActiveChips(c => c.includes(tag) ? c.filter(t => t !== tag) : [...c, tag]);
  }

  function locate() {
    setError(''); setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setPosition([lat, lon]);
        try {
          const results = await fetchHospitals(lat, lon);
          const withDist = results
            .map(h => ({ ...h, distance: haversine(lat, lon, h.lat, h.lon) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
          setHospitals(withDist);
        } catch {
          setError('Could not fetch nearby hospitals. Please try again.');
        }
        setLoading(false);
      },
      () => { setError('Location access denied. Please allow location in your browser.'); setLoading(false); }
    );
  }

  const filtered = hospitals.filter(h => {
    const name = (h.tags?.name || '').toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (activeChips.length === 0) return true;
    
    // Filter by active chips
    const tags = h.tags || {};
    const hasCardiology = activeChips.includes('cardiology') && 
      (tags.healthcare === 'cardiology' || tags.name?.toLowerCase().includes('cardio'));
    const hasICU = activeChips.includes('cardiac_icu') && 
      (tags.healthcare === 'icu' || tags.name?.toLowerCase().includes('icu'));
    const hasCathLab = activeChips.includes('cath_lab') && 
      (tags.healthcare === 'laboratory' || tags.name?.toLowerCase().includes('cath'));
    
    return hasCardiology || hasICU || hasCathLab;
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#f7f9fb' }}>

      {/* Left sidebar */}
      <div className="w-full lg:w-[400px] lg:min-w-[400px] flex flex-col h-screen lg:h-auto overflow-y-auto" style={{ background: '#fff', borderRight: '1px solid #eceef0' }}>
        <div className="p-6 border-b" style={{ borderColor: '#eceef0' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            <h1 className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Hospital Finder</h1>
          </div>
          <p className="text-xs mb-4" style={{ color: '#7c839b' }}>Find cardiac hospitals and clinics near you</p>

          <button
            onClick={locate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mb-4"
            style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
            {loading ? 'Locating…' : 'Find Nearby Hospitals'}
          </button>

          {error && (
            <div className="p-3 rounded-xl text-xs mb-4" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>
          )}

          {/* Search */}
          {hospitals.length > 0 && (
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: '#7c839b' }}>search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hospitals…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#f7f9fb', border: '1px solid #eceef0', color: '#191c1e' }}
              />
            </div>
          )}

          {/* Filter chips */}
          {hospitals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {FILTER_CHIPS.map(c => (
                <button
                  key={c.tag}
                  onClick={() => toggleChip(c.tag)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: activeChips.includes(c.tag) ? '#131b2e' : '#f7f9fb',
                    color: activeChips.includes(c.tag) ? '#fff' : '#45464d',
                    border: `1px solid ${activeChips.includes(c.tag) ? '#131b2e' : '#eceef0'}`,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hospital list */}
        <div className="flex-1 overflow-y-auto">
          {!position && !loading && (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#eceef0', fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <p className="text-sm mt-3" style={{ color: '#7c839b' }}>Click the button above to find hospitals near you.</p>
            </div>
          )}
          {filtered.map(h => (
            <button
              key={h.id}
              onClick={() => setSelected(h)}
              className="w-full text-left p-4 border-b transition-colors hover:bg-[#f7f9fb]"
              style={{
                borderColor: '#eceef0',
                background: selected?.id === h.id ? '#f0fdf4' : 'transparent',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}>
                    {h.tags?.name || 'Hospital / Clinic'}
                  </p>
                  {h.tags?.['addr:street'] && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#7c839b' }}>{h.tags['addr:street']}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>
                      Cardiology
                    </span>
                    <span className="text-xs" style={{ color: '#7c839b' }}>
                      {h.distance.toFixed(1)} km away
                    </span>
                  </div>
                </div>
                <a
                  href={mapsLink(h.lat, h.lon, h.tags?.name || '')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: '#131b2e', color: '#fff', fontFamily: 'Plus Jakarta Sans' }}
                >
                  <span className="material-symbols-outlined text-xs">directions</span>
                  Directions
                </a>
              </div>
            </button>
          ))}
          {position && filtered.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: '#7c839b' }}>No hospitals found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="hidden lg:flex flex-1 relative">
        {position ? (
          <>
            <MapContainer center={position} zoom={14} style={{ height: '100vh', width: '100%' }}>
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap center={position} />
              <Marker position={position} icon={userIcon}>
                <Popup>📍 Your Location</Popup>
              </Marker>
              {hospitals.map(h => (
                <Marker
                  key={h.id}
                  position={[h.lat, h.lon]}
                  icon={selected?.id === h.id ? selectedIcon : undefined}
                  eventHandlers={{ click: () => setSelected(h) }}
                >
                  <Popup>
                    <strong>{h.tags?.name || 'Hospital / Clinic'}</strong>
                    {h.tags?.['addr:street'] && <><br />{h.tags['addr:street']}</>}
                    {h.tags?.phone && <><br />📞 {h.tags.phone}</>}
                    <br />
                    <a href={mapsLink(h.lat, h.lon, h.tags?.name || '')} target="_blank" rel="noreferrer"
                      style={{ color: '#006c49', fontSize: 12 }}>Get Directions →</a>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Selected hospital floating card */}
            {selected && (
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-2xl p-4 shadow-xl flex items-center gap-4"
                style={{ background: '#fff', minWidth: 300, maxWidth: 400, border: '1px solid #eceef0' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#dcfce7' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}>
                    {selected.tags?.name || 'Hospital / Clinic'}
                  </p>
                  <p className="text-xs" style={{ color: '#7c839b' }}>{selected.distance.toFixed(1)} km away</p>
                </div>
                <a
                  href={mapsLink(selected.lat, selected.lon, selected.tags?.name || '')}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ background: '#006c49', fontFamily: 'Plus Jakarta Sans' }}
                >
                  Directions
                </a>
                <button onClick={() => setSelected(null)} style={{ color: '#7c839b' }}>
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '5rem', color: '#eceef0', fontVariationSettings: "'FILL' 1" }}>map</span>
            <p className="text-sm mt-4" style={{ color: '#7c839b' }}>Allow location access to see the map</p>
          </div>
        )}
      </div>
    </div>
  );
}
