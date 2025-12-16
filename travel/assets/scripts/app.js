const storageKey = 'travelPlannerItinerary';

const distanceForm = document.getElementById('distance-form');
const distanceResult = document.getElementById('distance-result');
const itineraryForm = document.getElementById('itinerary-form');
const itineraryList = document.getElementById('itinerary-list');
const clearButton = document.getElementById('clear-itinerary');

const cityCoordinates = {
  tehran: { lat: 35.6892, lng: 51.3890 },
  تهران: { lat: 35.6892, lng: 51.3890 },
  mashhad: { lat: 36.2970, lng: 59.6111 },
  مشهد: { lat: 36.2970, lng: 59.6111 },
  isfahan: { lat: 32.6525, lng: 51.6800 },
  اصفهان: { lat: 32.6525, lng: 51.6800 },
  shiraz: { lat: 29.5918, lng: 52.5836 },
  شیراز: { lat: 29.5918, lng: 52.5836 },
  tabriz: { lat: 38.0962, lng: 46.2738 },
  تبریز: { lat: 38.0962, lng: 46.2738 },
  karaj: { lat: 35.8400, lng: 50.9391 },
  کرج: { lat: 35.8400, lng: 50.9391 },
  ahvaz: { lat: 31.3183, lng: 48.6706 },
  اهواز: { lat: 31.3183, lng: 48.6706 },
  qom: { lat: 34.6416, lng: 50.8746 },
  قم: { lat: 34.6416, lng: 50.8746 },
  rasht: { lat: 37.2669, lng: 49.5881 },
  رشت: { lat: 37.2669, lng: 49.5881 },
  kerman: { lat: 30.2832, lng: 57.0788 },
  کرمان: { lat: 30.2832, lng: 57.0788 },
};

const toKey = (value) => value.trim().toLowerCase();

const findCityCoordinates = (city) => {
  if (!city) return null;
  const key = toKey(city);
  return cityCoordinates[key] || null;
};

const computeSphereDistance = (origin, destination) => {
  const originCoord = findCityCoordinates(origin);
  const destinationCoord = findCityCoordinates(destination);
  if (!originCoord || !destinationCoord) {
    throw new Error('برای محاسبه داخلی، لطفاً یکی از شهرهای پشتیبانی‌شده را وارد کنید.');
  }

  const toRadians = (degree) => (degree * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latDiff = toRadians(destinationCoord.lat - originCoord.lat);
  const lngDiff = toRadians(destinationCoord.lng - originCoord.lng);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(originCoord.lat)) *
      Math.cos(toRadians(destinationCoord.lat)) *
      Math.sin(lngDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatCurrency = (value) => new Intl.NumberFormat('fa-IR').format(value);

const renderItineraries = (items) => {
  if (!items.length) {
    itineraryList.innerHTML = '<p>هنوز برنامه‌ای ذخیره نشده است.</p>';
    return;
  }

  itineraryList.innerHTML = items
    .map(
      (item) => `
        <article class="itinerary__item">
          <div>
            <strong>${item.title}</strong>
            <p>${item.notes || 'بدون یادداشت اضافه'}</p>
          </div>
          <p>مدت: <span>${item.nights}</span> شب</p>
          <p>بودجه: <span>${formatCurrency(item.budget)}</span> ریال</p>
        </article>
      `
    )
    .join('');
};

const loadItineraries = () => {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
};

const saveItineraries = (items) => {
  localStorage.setItem(storageKey, JSON.stringify(items));
};

const setDistanceMessage = (message, isError = false) => {
  distanceResult.innerHTML = `<p class="form-note" style="color: ${isError ? '#ff6b6b' : 'var(--muted)'}">${message}</p>`;
};

const updateDistanceResult = ({ origin, destination, distance, duration, speed, source, note }) => {
  distanceResult.innerHTML = `
    <h4>نتایج سفر</h4>
    <p>مسافت بین ${origin} و ${destination}: <strong>${Math.round(distance).toLocaleString('fa-IR')} کیلومتر</strong> (${source})</p>
    <p>مدت زمان: <strong>${duration.toLocaleString('fa-IR')} ساعت</strong> (با سرعت متوسط ${speed.toLocaleString('fa-IR')} کیلومتر بر ساعت)</p>
    ${note ? `<p class="form-note">${note}</p>` : ''}
  `;
};

const fetchOsrmDistance = async (origin, destination) => {
  const geocode = async (input) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1`; // Free OSM geocoding
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'travel-planner-demo/1.0',
      },
    });
    if (!response.ok) {
      throw new Error('مشکل در دریافت مختصات از OpenStreetMap پیش آمد.');
    }
    const data = await response.json();
    if (!data.length) {
      throw new Error(`مختصات شهر «${input}» پیدا نشد.`);
    }
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  };

  const [originPoint, destinationPoint] = await Promise.all([geocode(origin), geocode(destination)]);
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originPoint.lon},${originPoint.lat};${destinationPoint.lon},${destinationPoint.lat}?overview=false`;
  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error('سرویس مسیریابی OSRM در دسترس نیست.');
  }
  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('OSRM نتوانست مسیر مناسبی پیدا کند.');
  }

  const route = data.routes[0];
  return {
    distance: route.distance / 1000,
    duration: route.duration / 3600,
  };
};

const handleDistanceSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(distanceForm);
  const origin = formData.get('origin').trim();
  const destination = formData.get('destination').trim();
  const speed = Number(formData.get('speed'));

  if (!origin || !destination || !speed) {
    setDistanceMessage('لطفاً همه فیلدهای مبدا، مقصد و سرعت را پر کنید.', true);
    return;
  }

  try {
    setDistanceMessage('در حال دریافت مسیر از OpenStreetMap/OSRM ...');
    let results;
    let source = 'OSRM (OpenStreetMap)';
    try {
      results = await fetchOsrmDistance(origin, destination);
    } catch (osrmError) {
      console.error(osrmError);
      source = 'محاسبه کروی داخلی';
      results = {
        distance: computeSphereDistance(origin, destination),
      };
    }

    const duration = Math.round(((results.distance / speed) || results.duration) * 10) / 10;
    updateDistanceResult({
      origin,
      destination,
      distance: results.distance,
      duration,
      speed,
      source,
      note: source === 'محاسبه کروی داخلی' ? 'OSRM در دسترس نبود؛ این مقدار تخمینی است.' : '',
    });
  } catch (error) {
    console.error(error);
    setDistanceMessage(error.message || 'در محاسبه فاصله خطایی رخ داد.', true);
  }
};

const handleItinerarySubmit = (event) => {
  event.preventDefault();
  const data = new FormData(itineraryForm);
  const item = {
    title: data.get('title').trim(),
    nights: Number(data.get('nights')),
    budget: Number(data.get('budget')),
    notes: data.get('notes').trim(),
  };

  const items = loadItineraries();
  items.unshift(item);
  saveItineraries(items);
  renderItineraries(items);
  itineraryForm.reset();
};

const handleClearItinerary = () => {
  localStorage.removeItem(storageKey);
  renderItineraries([]);
};

const init = () => {
  distanceForm.addEventListener('submit', handleDistanceSubmit);
  itineraryForm.addEventListener('submit', handleItinerarySubmit);
  clearButton.addEventListener('click', handleClearItinerary);
  renderItineraries(loadItineraries());
};

window.addEventListener('DOMContentLoaded', init);
