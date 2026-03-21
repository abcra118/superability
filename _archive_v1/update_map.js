const fs = require('fs');
const file = 'src/components/JourneyMap.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchTop = \`export function JourneyMap({ journey, vehicles = [], mode = 'metro' }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  const [stopPoints, setStopPoints] = useState<{lat: number, lon: number, name: string}[]>([]);\`;

const replaceTop = \`export function JourneyMap({ journey, vehicles = [], mode = 'metro' }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  const [stopPoints, setStopPoints] = useState<{lat: number, lon: number, name: string}[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  useEffect(() => {
    fetch('/api/mapbox-token')
      .then(res => {
        if (\!res.ok) throw new Error('Limit reached or missing token');
        return res.json();
      })
      .then(data => setToken(data.token))
      .catch(err => {
        console.error("Map unavailable:", err);
        setMapUnavailable(true);
      });
  }, []);\`;

content = content.replace(searchTop, replaceTop);

const searchBot = \`  const activeColor = MODE_COLORS[mode] || MODE_COLORS.metro;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  if (\!token) return <div className="w-full h-80 bg-slate-200 flex items-center justify-center rounded-[2rem]">Missing Mapbox Token</div>;

  return (\`;

const replaceBot = \`  const activeColor = MODE_COLORS[mode] || MODE_COLORS.metro;

  if (mapUnavailable || \!token) {
    return (
      <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border-4 border-slate-200 shadow-xl mb-8 flex flex-col items-center justify-center bg-slate-100 text-slate-500">
        {mapUnavailable ? (
           <>
             <span className="font-bold text-lg text-slate-600">Map is currently resting</span>
             <span className="text-sm">(Monthly API Limit Reached)</span>
           </>
        ) : (
           <span className="animate-pulse">Loading map...</span>
        )}
      </div>
    );
  }

  return (\`;

content = content.replace(searchBot, replaceBot);

fs.writeFileSync(file, content);
console.log('JourneyMap updated!');
