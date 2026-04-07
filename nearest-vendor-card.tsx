'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface GeoPoint { lat: number; lng: number; }

interface VendorWithDistance {
  vendor: {
    id: string;
    company_name: string;
    district: string;
    tier: string;
    score: number;
    load_status: string;
    delivery_time_hours: number;
    services: string[];
  };
  distanceKm: number;
  estimatedDeliveryHours: number;
  deliveryCost: number;
  score: number;
}

interface GeoRoutingResult {
  nearest: VendorWithDistance | null;
  candidates: VendorWithDistance[];
  estimatedSavings: number;
  customerLocation: GeoPoint;
}

const UB_DISTRICTS = [
  'БЗД','СХД','ХУД','ЧД','СБД','БГД','НД','БНД',
];

const TIER_COLORS: Record<string, string> = {
  gold:   '#BA7517',
  silver: '#5F5E5A',
  bronze: '#993C1D',
};

const LOAD_LABELS: Record<string, string> = {
  available: 'Чөлөөтэй',
  busy:      'Завгүй',
  full:      'Дүүрсэн',
};

export function useGeoLocation() {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Браузер байршил дэмжихгүй байна');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        // Fallback: УБ төв
        setLocation({ lat: 47.9138, lng: 106.9057 });
        setLoading(false);
      },
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => { detect(); }, [detect]);

  return { location, loading, error, detect };
}

interface NearestVendorCardProps {
  productType?: string;
  quantity?: number;
  onVendorSelect?: (vendorId: string, deliveryCost: number) => void;
}

export default function NearestVendorCard({
  productType,
  quantity,
  onVendorSelect,
}: NearestVendorCardProps) {
  const { location, loading: geoLoading } = useGeoLocation();
  const [result, setResult] = useState<GeoRoutingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<'best_score' | 'nearest' | 'fastest' | 'cheapest'>('best_score');
  const [manualDistrict, setManualDistrict] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const fetchNearestVendors = useCallback(async (loc: GeoPoint) => {
    setLoading(true);
    try {
      const data = await apiFetch<GeoRoutingResult>('/geo/nearest-vendors', {
        method: 'POST',
        auth: false,
        body: { lat: loc.lat, lng: loc.lng, productType, quantity, strategy },
      });
      setResult(data);
      if (data.nearest && !selectedVendor) {
        setSelectedVendor(data.nearest.vendor.id);
        onVendorSelect?.(data.nearest.vendor.id, data.nearest.deliveryCost);
      }
    } catch {
      // Geo API байхгүй бол silent fail
    } finally {
      setLoading(false);
    }
  }, [productType, quantity, strategy, onVendorSelect, selectedVendor]);

  useEffect(() => {
    if (location) fetchNearestVendors(location);
  }, [location, strategy]);

  const handleDistrictSelect = async (district: string) => {
    setManualDistrict(district);
    try {
      const data = await apiFetch<{ name: string; lat: number; lng: number }[]>('/geo/districts', { auth: false });
      const found = data.find(d => d.name === district);
      if (found) fetchNearestVendors({ lat: found.lat, lng: found.lng });
    } catch {}
  };

  const handleSelect = (v: VendorWithDistance) => {
    setSelectedVendor(v.vendor.id);
    onVendorSelect?.(v.vendor.id, v.deliveryCost);
  };

  if (geoLoading || loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ойр үйлдвэр хайж байна...</p>
          <p className="text-xs text-gray-400 mt-0.5">Байршилд тулгуурлан тооцоолж байна</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Ойр үйлдвэр сонгох
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Таны байршилд хамгийн ойр, хурдан хүргэлттэй
          </p>
        </div>

        {/* Strategy selector */}
        <div className="flex gap-1">
          {([
            { id: 'best_score', label: 'Зөвлөмж' },
            { id: 'nearest', label: 'Ойр' },
            { id: 'fastest', label: 'Хурдан' },
            { id: 'cheapest', label: 'Хямд' },
          ] as const).map(s => (
            <button key={s.id} onClick={() => setStrategy(s.id)}
              className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                strategy === s.id
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual district selector */}
      <div className="flex flex-wrap gap-1">
        {UB_DISTRICTS.map(d => (
          <button key={d} onClick={() => handleDistrictSelect(d)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              manualDistrict === d
                ? 'bg-blue-500 text-white'
                : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            {d}
          </button>
        ))}
      </div>

      {/* Savings badge */}
      {result?.estimatedSavings && result.estimatedSavings > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#1D9E75" strokeWidth="1.5"/>
            <path d="M4.5 7l2 2 3-3" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-green-700 dark:text-green-400">
            Ойр үйлдвэр сонгосноор хүргэлтэд <span className="font-medium">{result.estimatedSavings.toLocaleString()}₮</span> хэмнэнэ
          </p>
        </div>
      )}

      {/* Vendor list */}
      {result?.candidates.map(v => (
        <div
          key={v.vendor.id}
          onClick={() => handleSelect(v)}
          className={`border rounded-xl p-4 cursor-pointer transition-all ${
            selectedVendor === v.vendor.id
              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Select indicator */}
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
              selectedVendor === v.vendor.id ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {selectedVendor === v.vendor.id && (
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {v.vendor.company_name}
                </span>
                <span className="text-xs font-medium" style={{ color: TIER_COLORS[v.vendor.tier] }}>
                  {v.vendor.tier?.toUpperCase()}
                </span>
                {v.vendor.district && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                    {v.vendor.district}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  v.vendor.load_status === 'available'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : v.vendor.load_status === 'busy'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {LOAD_LABELS[v.vendor.load_status] ?? v.vendor.load_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Зай</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {v.distanceKm.toFixed(1)} км
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Хүргэлт</p>
                  <p className={`text-sm font-medium ${v.deliveryCost === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {v.deliveryCost === 0 ? 'Үнэгүй' : `${v.deliveryCost.toLocaleString()}₮`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Хугацаа</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ~{v.estimatedDeliveryHours}ц
                  </p>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-medium" style={{
                color: v.score >= 80 ? '#1D9E75' : v.score >= 60 ? '#BA7517' : '#888780'
              }}>
                {v.score}
              </div>
              <div className="text-xs text-gray-400">оноо</div>
            </div>
          </div>
        </div>
      ))}

      {result && result.candidates.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          Таны байршилд ойр үйлдвэр олдсонгүй
        </div>
      )}
    </div>
  );
}
