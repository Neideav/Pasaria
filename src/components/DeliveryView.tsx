import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Navigation,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Compass,
  Building2,
  Home,
  CheckCircle
} from 'lucide-react';
import { DeliveryShipment, Order } from '../types';
import { ProductVisual } from './ProductVisual';

interface DeliveryViewProps {
  activeShipment: DeliveryShipment | null;
  orders?: Order[];
  onNavigateHome: () => void;
  onSelectProductBySlug?: (slug: string) => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  activeShipment,
  orders = [],
  onNavigateHome,
}) => {
  const [searchTracking, setSearchTracking] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [courierPositionPercent, setCourierPositionPercent] = useState(55);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');

  // Build available shipments from active shipment and orders
  const availableShipments: DeliveryShipment[] = [];
  if (activeShipment) {
    availableShipments.push(activeShipment);
  }

  // Convert orders to shipment options if available
  orders.forEach((ord) => {
    if (!availableShipments.some((s) => s.order_number === ord.order_number)) {
      availableShipments.push({
        id: `shp-${ord.order_number}`,
        order_number: ord.order_number,
        courier_name: ord.courier || 'Shopcart Express Priority',
        courier_service: ord.courier_service || 'Standard Ground Tracking',
        tracking_number: ord.tracking_number || `SC-TRK-${ord.order_number}`,
        status: 'in_transit',
        status_label: 'In Transit — En Route with Courier Specialist',
        recipient_name: ord.customer_name,
        recipient_phone: '+1 (555) 234-5678',
        delivery_address: ord.shipping_address,
        origin_address: 'Central Fulfillment Hub #4, North Logistics Park',
        estimated_arrival: ord.estimated_delivery || 'Tomorrow by 2:00 PM',
        driver_name: 'Marcus Vance (Courier Specialist)',
        driver_phone: '+1 (555) 987-6543',
        driver_vehicle: 'Eco Electric Van #EV-428',
        current_location: 'Regional Distribution Center, Sector 7',
        items_count: ord.items?.reduce((s, i) => s + i.quantity, 0) || 1,
        items_preview: ord.items?.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          image: i.image,
          color: i.color,
        })),
        total_amount: ord.total,
        created_at: ord.created_at || new Date().toISOString(),
        checkpoints: [
          {
            id: 'cp-1',
            title: 'Order Confirmed & Processed',
            location: 'Shopcart Warehouse',
            timestamp: '10:00 AM',
            status: 'completed',
            description: 'Order confirmed and ready for dispatch.'
          },
          {
            id: 'cp-2',
            title: 'Picked Up by Courier',
            location: 'Logistics Center',
            timestamp: '11:30 AM',
            status: 'completed',
            description: 'Assigned tracking barcode.'
          },
          {
            id: 'cp-3',
            title: 'In Transit — En Route to Local Hub',
            location: 'Logistics Expressway',
            timestamp: 'Active Now',
            status: 'current',
            description: 'Courier en route with live GPS.'
          },
          {
            id: 'cp-4',
            title: 'Out for Final Delivery',
            location: ord.shipping_address,
            timestamp: ord.estimated_delivery || 'Tomorrow',
            status: 'upcoming',
            description: 'Driver will arrive at destination address.'
          },
          {
            id: 'cp-5',
            title: 'Delivered',
            location: ord.shipping_address,
            timestamp: ord.estimated_delivery || 'Tomorrow',
            status: 'upcoming',
            description: 'Signed confirmation.'
          }
        ]
      });
    }
  });

  // Only show real shipments — no demo fallback
  if (availableShipments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <Truck className="w-9 h-9 text-slate-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Belum Ada Pengiriman</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Pengiriman akan muncul di sini setelah kamu melakukan pembelian. Yuk mulai belanja!
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-full bg-[#003d29] text-white text-sm font-bold hover:bg-[#064e3b] transition-colors cursor-pointer"
          >
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  const resolvedShipmentId = selectedShipmentId || availableShipments[0]?.id || '';

  const currentShipment =
    availableShipments.find((s) => s.id === resolvedShipmentId) || availableShipments[0];

  // Real-time live status simulation
  const handleSimulateAdvance = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setCourierPositionPercent((prev) => (prev >= 90 ? 30 : prev + 20));
      setIsSimulating(false);
    }, 500);
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(currentShipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTracking.trim()) return;
    const found = availableShipments.find(
      (s) =>
        s.tracking_number.toLowerCase().includes(searchTracking.toLowerCase().trim()) ||
        s.order_number.includes(searchTracking.trim())
    );
    if (found) {
      setSelectedShipmentId(found.id);
      setSearchTracking('');
    } else {
      alert(`Tracking number "${searchTracking}" loaded into live GPS monitor!`);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'processing':
        return 0;
      case 'picked_up':
        return 1;
      case 'in_transit':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 2;
    }
  };

  const currentStep = getStatusStepIndex(currentShipment.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <button onClick={onNavigateHome} className="hover:text-slate-700">Home</button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 font-semibold">Delivery & Courier Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            <span>Live Delivery Tracking</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateAdvance}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#003d29] bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Simulate courier vehicle movement on map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate Live Movement</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>

      {/* Package / Order Selector (Pilihan Barang Yang Sedang Dikirim) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#003d29]" />
            <span>Pilih Paket Pengiriman Anda ({availableShipments.length} Paket Tersedia)</span>
          </h3>

          {/* Quick Tracking Search Bar */}
          <form onSubmit={handleSearchLookup} className="flex gap-2">
            <input
              type="text"
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              placeholder="Cari no. resi / order..."
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#003d29] w-48 sm:w-60"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#003d29] text-white text-xs font-semibold rounded-xl hover:bg-[#064e3b] transition-colors"
            >
              Cek
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableShipments.map((shipment) => {
            const isSelected = shipment.id === currentShipment.id;
            return (
              <div
                key={shipment.id}
                onClick={() => setSelectedShipmentId(shipment.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-[#003d29] bg-[#003d29]/5 shadow-sm ring-2 ring-[#003d29]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#003d29] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Order #{shipment.order_number}
                      </div>
                      <div className="text-[11px] text-[#003d29] font-medium">
                        {shipment.courier_name}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {shipment.tracking_number}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    {shipment.items_preview?.[0]?.name || `${shipment.items_count} Barang`}
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {shipment.estimated_arrival}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Tracking Details & Interactive Map, Right Recipient & Courier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Courier Badge, Centered Stepper, Map, Checkpoints */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Shipment Overview Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-6">
            {/* Courier Banner & Tracking Code */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                  <Truck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Jasa Pengiriman / Carrier</div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {currentShipment.courier_name}
                  </h3>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {currentShipment.courier_service}
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs text-slate-400 font-medium">Nomor Resi (AWB)</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    {currentShipment.tracking_number}
                  </span>
                  <button
                    onClick={handleCopyTracking}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#003d29] hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Salin no resi"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Status Highlight */}
            <div className="p-4 rounded-2xl bg-[#003d29]/5 border border-[#003d29]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#003d29] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Status Lokasi Terkini (Real-Time)</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {currentShipment.status_label}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-[#003d29] shrink-0" />
                  <span>Titik GPS: {currentShipment.current_location}</span>
                </div>
              </div>

              <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Estimasi Tiba</div>
                <div className="text-sm sm:text-base font-extrabold text-[#003d29]">
                  {currentShipment.estimated_arrival}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Centered Stepper Progress Bar (Presisi Lurus dengan Lingkaran) */}
            {/* ========================================================================= */}
            <div className="py-2">
              <div className="relative">
                {/* Horizontal Background Line (Center-aligned with the 36px icons) */}
                <div className="absolute top-4.5 left-5 right-5 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                {/* Horizontal Active Line */}
                <div
                  className="absolute top-4.5 left-5 h-1 bg-[#003d29] -translate-y-1/2 transition-all duration-500 z-0"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentStep / 4) * 100))}%`
                  }}
                ></div>

                {/* Stepper Nodes */}
                <div className="relative flex items-start justify-between z-10">
                  {[
                    { label: 'Confirmed', icon: CheckCircle2 },
                    { label: 'Picked Up', icon: Package },
                    { label: 'In Transit', icon: Truck },
                    { label: 'Out for Delivery', icon: Navigation },
                    { label: 'Delivered', icon: ShieldCheck }
                  ].map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const Icon = step.icon;

                    return (
                      <div key={idx} className="flex flex-col items-center group cursor-default">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-[#003d29] text-white shadow-xs'
                              : isCurrent
                              ? 'bg-white border-2 border-[#003d29] text-[#003d29] shadow-md ring-4 ring-emerald-50'
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <span
                          className={`text-[11px] mt-2 font-semibold text-center whitespace-nowrap ${
                            isCurrent
                              ? 'text-[#003d29] font-bold'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PETA INTERAKTIF REAL-TIME (Visual Map Kurir Pengiriman) */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#003d29]" />
                  <span>Peta Rute & Posisi Kurir Real-Time</span>
                </h4>
              </div>

              {/* Map Canvas Visualizer */}
              <div className="relative w-full h-72 sm:h-80 rounded-3xl overflow-hidden border border-slate-200/80 shadow-inner bg-[#eef4f1] p-4 flex flex-col justify-between select-none">
                {/* Subtle map road grid patterns */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `
                      radial-gradient(#003d29 0.75px, transparent 0.75px),
                      linear-gradient(to right, #d3e4dc 1px, transparent 1px),
                      linear-gradient(to bottom, #d3e4dc 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px, 48px 48px, 48px 48px'
                  }}
                ></div>

                {/* SVG Delivery Route Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#003d29" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Road backdrop */}
                  <path
                    d="M 60 220 Q 200 180 320 140 T 680 70"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Road lane */}
                  <path
                    d="M 60 220 Q 200 180 320 140 T 680 70"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Active delivery path */}
                  <path
                    d="M 60 220 Q 200 180 320 140 T 680 70"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="4"
                    strokeDasharray="6,6"
                    className="animate-pulse"
                  />
                </svg>

                {/* Top Overlay: Route details banner */}
                <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="font-bold text-slate-800">
                      Rute: {currentShipment.origin_address.split(',')[0]} → {currentShipment.delivery_address.split(',')[0]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Kecepatan Kurir: <span className="font-bold text-slate-900">38 km/jam</span> · Kondisi: <span className="text-emerald-700 font-bold">Lancar</span>
                  </div>
                </div>

                {/* Map Pins: Origin Warehouse */}
                <div className="absolute left-6 bottom-8 z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="mt-1 bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-100">
                    Gudang Pusat
                  </span>
                </div>

                {/* Map Pins: Live Moving Courier Truck */}
                <div
                  className="absolute z-20 flex flex-col items-center transition-all duration-700 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${courierPositionPercent}%`,
                    top: `${180 - (courierPositionPercent / 100) * 110}px`
                  }}
                >
                  {/* Driver Speech Tooltip */}
                  <div className="bg-[#003d29] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 mb-1.5 whitespace-nowrap animate-bounce">
                    <Truck className="w-3 h-3 text-emerald-300" />
                    <span>Kurir {currentShipment.driver_name?.split(' ')[0]}: Sedang Menuju Rumah Anda!</span>
                  </div>

                  {/* Vehicle Marker */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl border-3 border-white ring-4 ring-emerald-400/40">
                      <Truck className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-ping"></span>
                  </div>
                </div>

                {/* Map Pins: Destination Home */}
                <div className="absolute right-6 top-10 z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#003d29] text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500/50">
                    <Home className="w-5 h-5 text-emerald-300" />
                  </div>
                  <span className="mt-1 bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-100">
                    Alamat Anda
                  </span>
                </div>

                {/* Bottom Overlay: Live telemetry cards */}
                <div className="relative z-10 grid grid-cols-3 gap-2 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-100 text-center text-xs shadow-sm">
                  <div>
                    <div className="text-[10px] text-slate-400">Jarak Tersisa</div>
                    <div className="font-extrabold text-slate-900 mt-0.5">
                      {courierPositionPercent >= 80 ? '0.8 km' : '2.4 km'}
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[10px] text-slate-400">Estimasi Sampai</div>
                    <div className="font-extrabold text-[#003d29] mt-0.5">
                      {courierPositionPercent >= 80 ? '10 Menit' : '25 Menit'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Nama Pengemudi</div>
                    <div className="font-extrabold text-slate-900 truncate mt-0.5">
                      {currentShipment.driver_name?.split(' ')[0] || 'Marcus'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Tracking Timeline */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Perjalanan Paket (Tracking Timeline)
            </h3>

            <div className="space-y-6 relative pl-2">
              <div className="absolute top-3 bottom-3 left-5 w-0.5 bg-slate-200/80 -z-0"></div>

              {currentShipment.checkpoints.map((cp, idx) => {
                const isCompleted = cp.status === 'completed';
                const isCurrent = cp.status === 'current';

                return (
                  <div key={cp.id || idx} className="relative flex items-start gap-4 z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs transition-all ${
                        isCompleted
                          ? 'bg-[#003d29] text-white shadow-2xs'
                          : isCurrent
                          ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100 animate-pulse'
                          : 'bg-white border-2 border-slate-200 text-slate-300'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                      )}
                    </div>

                    <div className="flex-1 pb-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-[#003d29]'
                              : isCompleted
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {cp.title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {cp.timestamp}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        {cp.location}
                      </div>
                      {cp.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {cp.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Courier Driver & Recipient & Items */}
        <div className="lg:col-span-4 space-y-6">
          {/* Driver / Courier Contact Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Kurir yang Mengirimkan
            </h3>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#003d29] text-white font-bold text-sm flex items-center justify-center shadow-md">
                MV
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {currentShipment.driver_name || 'Petugas Kurir'}
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  {currentShipment.courier_name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentShipment.driver_vehicle || 'Express Delivery Van'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${currentShipment.driver_phone || '+15552345678'}`}
                className="flex-1 py-2.5 px-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200/80 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Telepon</span>
              </a>
              <button
                onClick={() =>
                  alert(
                    `Pesan terkirim ke ${currentShipment.driver_name}: "Kurir sedang fokus berkendara dan akan tiba di lokasi sesuai estimasi."`
                  )
                }
                className="flex-1 py-2.5 px-3 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat Kurir</span>
              </button>
            </div>
          </div>

          {/* Delivery Recipient & Destination Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-3.5 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Informasi Penerima & Alamat
            </h3>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">Nama Penerima</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {currentShipment.recipient_name}
              </div>
              <div className="text-slate-500">{currentShipment.recipient_phone}</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Alamat Pengiriman</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {currentShipment.delivery_address}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Nomor Pesanan</div>
              <div className="font-bold text-slate-900 mt-0.5">
                #{currentShipment.order_number}
              </div>
            </div>
          </div>

          {/* Parcel Items in Shipment */}
          {currentShipment.items_preview && currentShipment.items_preview.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-3.5 text-xs">
              <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                Isi Paket Pengiriman ({currentShipment.items_preview.length} Barang)
              </h3>

              <div className="space-y-3">
                {currentShipment.items_preview.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center p-1 border border-slate-100 shrink-0">
                      <ProductVisual imageKey={item.image || 'airpods-max'} name={item.name} size="sm" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Qty: {item.quantity} {item.color ? `· Warna: ${item.color}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe & Secure Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="leading-snug">
              Dilindungi oleh Jaminan Garansi Pengiriman Shopcart 100% aman dan bergaransi sampai ke tangan Anda.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
