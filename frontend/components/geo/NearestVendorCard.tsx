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
}

const UB_DISTRICTS = ['БЗД','СХД','ХУД','ЧД','СБД','БГД','НД','БНД'];

const TIER_COLORS: Record<string, string> = { gold: '#BA7517', silver: '#5F5E5A', bronze: '#993C1D' };
const LOAD_LABELS: Record<string, string> = { available: 'Чөлөөтэй', busy: 'Завгүй', full: 'Дүүрсэн' };

export function useGeoLocation() {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);

  const detect = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocation({ lat: 47.9138, lng: 106.9057 });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false); },
      () => { setLocation({ lat: 47.9138, lng: 106.9057 }); setLoading(false); },
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(detect, 0);
    return () => window.clearTimeout(timeout);
  }, [detect]);
  return { location, loading, detect };
}

interface Props {
  productType?: string;
  quantity?: number;
  onVendorSelect?: (vendorId: string, deliveryCost: number) => void;
}

export default function NearestVendorCard({ productType, quantity, onVendorSelect }: Props) {
  const { location, loading: geoLoading } = useGeoLocation();
  const [result, setResult] = useState<GeoRoutingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<string>('best_score');
  const [manualDistrict, setManualDistrict] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const fetchVendors = useCallback(async (loc: GeoPoint) => {
    setLoading(true);
    try {
      const data = await apiFetch<GeoRoutingResult>('/geo/nearest-vendors', {
        method: 'POST', auth: false,
        body: { lat: loc.lat, lng: loc.lng, productType, quantity, strategy },
      });
      setResult(data);
      if (data.nearest && !selectedVendor) {
        setSelectedVendor(data.nearest.vendor.id);
        onVendorSelect?.(data.nearest.vendor.id, data.nearest.deliveryCost);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [productType, quantity, strategy, onVendorSelect, selectedVendor]);

  useEffect(() => {
    if (!location) return;
    const timeout = window.setTimeout(() => fetchVendors(location), 0);
    return () => window.clearTimeout(timeout);
  }, [location, strategy]);

  const handleDistrictSelect = async (district: string) => {
    setManualDistrict(district);
    try {
      const data = await apiFetch<{ name: string; lat: number; lng: number }[]>('/geo/districts', { auth: false });
      const found = data.find(d => d.name === district);
      if (found) fetchVendors({ lat: found.lat, lng: found.lng });
    } catch {}
  };

  const handleSelect = (v: VendorWithDistance) => {
    setSelectedVendor(v.vendor.id);
    onVendorSelect?.(v.vendor.id, v.deliveryCost);
  };

  if (geoLoading || loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Ойр үйлдвэр хайж байна...</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>Байршилд тулгуурлан тооцоолж байна</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Ойр үйлдвэр сонгох</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>Таны байршилд хамгийн ойр, хурдан хүргэлттэй</p>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'best_score', label: 'Зөвлөмж' },
            { id: 'nearest', label: 'Ойр' },
            { id: 'fastest', label: 'Хурдан' },
            { id: 'cheapest', label: 'Хямд' },
          ].map(s => (
            <button key={s.id} onClick={() => setStrategy(s.id)}
              className="px-2 py-1 rounded-lg text-xs transition-colors"
              style={{
                background: strategy === s.id ? '#FF6B00' : 'transparent',
                color: strategy === s.id ? '#fff' : 'var(--text3)',
                border: strategy === s.id ? 'none' : '1px solid var(--border)',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {UB_DISTRICTS.map(d => (
          <button key={d} onClick={() => handleDistrictSelect(d)}
            className="px-2.5 py-1 rounded-lg text-xs transition-colors"
            style={{
              background: manualDistrict === d ? '#378ADD' : 'transparent',
              color: manualDistrict === d ? '#fff' : 'var(--text3)',
              border: manualDistrict === d ? 'none' : '1px solid var(--border)',
            }}>
            {d}
          </button>
        ))}
      </div>

      {(result?.estimatedSavings ?? 0) > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
          <span style={{ color: '#059669' }}>✓</span>
          <p className="text-xs" style={{ color: '#059669' }}>
            Ойр үйлдвэр сонгосноор хүргэлтэд <span className="font-medium">{result!.estimatedSavings!.toLocaleString()}₮</span> хэмнэнэ
          </p>
        </div>
      )}

      {result?.candidates.map(v => (
        <div key={v.vendor.id} onClick={() => handleSelect(v)}
          className="rounded-xl p-4 cursor-pointer transition-all"
          style={{
            border: `1.5px solid ${selectedVendor === v.vendor.id ? '#FF6B00' : 'var(--border)'}`,
            background: selectedVendor === v.vendor.id ? 'rgba(255,107,0,0.04)' : 'var(--surface)',
          }}>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{ border: `2px solid ${selectedVendor === v.vendor.id ? '#FF6B00' : 'var(--border)'}` }}>
              {selectedVendor === v.vendor.id && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{v.vendor.company_name}</span>
                <span className="text-xs font-medium" style={{ color: TIER_COLORS[v.vendor.tier] }}>{v.vendor.tier?.toUpperCase()}</span>
                {v.vendor.district && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>{v.vendor.district}</span>}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: v.vendor.load_status === 'available' ? 'rgba(5,150,105,0.1)' : 'rgba(186,117,23,0.1)',
                  color: v.vendor.load_status === 'available' ? '#059669' : '#BA7517',
                }}>{LOAD_LABELS[v.vendor.load_status] ?? v.vendor.load_status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text4)' }}>Зай</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v.distanceKm.toFixed(1)} км</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text4)' }}>Хүргэлт</p>
                  <p className="text-sm font-medium" style={{ color: v.deliveryCost === 0 ? '#059669' : 'var(--text)' }}>
                    {v.deliveryCost === 0 ? 'Үнэгүй' : `${v.deliveryCost.toLocaleString()}₮`}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text4)' }}>Хугацаа</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>~{v.estimatedDeliveryHours}ц</p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-medium" style={{ color: v.score >= 80 ? '#059669' : v.score >= 60 ? '#BA7517' : 'var(--text3)' }}>{v.score}</div>
              <div className="text-xs" style={{ color: 'var(--text4)' }}>оноо</div>
            </div>
          </div>
        </div>
      ))}

      {result && result.candidates.length === 0 && (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text4)' }}>Таны байршилд ойр үйлдвэр олдсонгүй</div>
      )}
    </div>
  );
}
