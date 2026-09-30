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
  Check
} from 'lucide-react';
import { DeliveryShipment } from '../types';
import { ProductVisual } from './ProductVisual';

interface DeliveryViewProps {
  activeShipment: DeliveryShipment | null;
  onNavigateHome: () => void;
  onSelectProductBySlug?: (slug: string) => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  activeShipment,
  onNavigateHome,
}) => {
  const [searchTracking, setSearchTracking] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fallback demo shipment if no active order exists yet
  const defaultDemoShipment: DeliveryShipment = {
    id: 'shp-demo-01',
    order_number: '9945284820',
    courier_name: 'Shopcart Priority Express',
    courier_service: 'Guaranteed 24-Hour Express Air & Ground',
    tracking_number: 'SC-EXP-88492041',
    status: 'in_transit',
    status_label: 'In Transit — On Route to Local Delivery Hub',
    recipient_name: 'Customer',
    recipient_phone: '+1 (555) 234-5678',
    delivery_address: '4140 Parker Rd, Allentown, PA 31134',
    origin_address: 'Central Fulfillment Center #4, North Hub',
    estimated_arrival: 'Today by 3:45 PM (In ~42 mins)',
    driver_name: 'Marcus Vance (Courier Specialist)',
    driver_phone: '+1 (555) 987-6543',
    driver_vehicle: 'Eco Electric Van #EV-428',
    current_location: 'Distribution Sorting Center, Sector 7 — 3.8 miles away',
    items_count: 2,
    items_preview: [
      { name: 'Airpods- Max', quantity: 1, color: 'Pink', image: 'airpods-max' },
      { name: 'Bose QuietComfort', quantity: 1, color: 'Black', image: 'bose-bt-45' }
    ],
    total_amount: 838.0,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    checkpoints: [
      {
        id: 'cp-1',
        title: 'Order Confirmed & Securely Packed',
        location: 'Shopcart Central Warehouse, Bay 14',
        timestamp: '10:15 AM',
        status: 'completed',
        description: 'Items inspected for quality and barcode scanned for shipment dispatch.'
      },
      {
        id: 'cp-2',
        title: 'Picked Up by Courier Specialist',
        location: 'Shopcart Express Logistics Hub',
        timestamp: '11:40 AM',
        status: 'completed',
        description: 'Handed over to carrier. Airway bill assigned and initial security clearance cleared.'
      },
      {
        id: 'cp-3',
        title: 'Departed Sorting Facility (In Transit)',
        location: 'Regional Distribution Center, Sector 7',
        timestamp: '01:25 PM',
        status: 'current',
        description: 'Package currently in transport on Eco Van #EV-428 moving toward your neighborhood.'
      },
      {
        id: 'cp-4',
        title: 'Out for Final Delivery',
        location: 'Local Delivery Unit',
        timestamp: 'Estimated 02:45 PM',
        status: 'upcoming',
        description: 'Driver will contact your phone upon arrival at front door.'
      },
      {
        id: 'cp-5',
        title: 'Delivered to Recipient',
        location: 'Destination Address',
        timestamp: 'Estimated 03:45 PM',
        status: 'upcoming',
        description: 'Photo proof and contactless confirmation upon handover.'
      }
    ]
  };

  const [currentShipment, setCurrentShipment] = useState<DeliveryShipment>(
    activeShipment || defaultDemoShipment
  );

  useEffect(() => {
    if (activeShipment) {
      setCurrentShipment(activeShipment);
    }
  }, [activeShipment]);

  // Real-time live status update simulation
  const handleSimulateAdvance = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setCurrentShipment((prev) => {
        const next = { ...prev };
        const updatedCheckpoints = [...prev.checkpoints];
        const currentIdx = updatedCheckpoints.findIndex((c) => c.status === 'current');

        if (currentIdx > -1 && currentIdx < updatedCheckpoints.length - 1) {
          updatedCheckpoints[currentIdx].status = 'completed';
          updatedCheckpoints[currentIdx + 1].status = 'current';

          if (currentIdx + 1 === 3) {
            next.status = 'out_for_delivery';
            next.status_label = 'Out for Final Delivery — Driver is 0.8 miles away!';
            next.current_location = 'Main Street, Approaching Destination';
            next.estimated_arrival = 'Within 15 minutes!';
          } else if (currentIdx + 1 === 4) {
            next.status = 'delivered';
            next.status_label = 'Package Successfully Delivered!';
            next.current_location = 'Delivered at front porch (Signed)';
            next.estimated_arrival = 'Completed Just Now';
          }
        } else {
          // Reset to in transit for continuous testing
          updatedCheckpoints[2].status = 'current';
          updatedCheckpoints[3].status = 'upcoming';
          updatedCheckpoints[4].status = 'upcoming';
          next.status = 'in_transit';
          next.status_label = 'In Transit — On Route to Local Delivery Hub';
          next.current_location = 'Regional Distribution Center, Sector 7';
          next.estimated_arrival = 'Today by 3:45 PM';
        }

        next.checkpoints = updatedCheckpoints;
        return next;
      });
      setIsSimulating(false);
    }, 600);
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(currentShipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTracking.trim()) return;
    // Load tracking info
    alert(`Searching real-time courier records for "${searchTracking}"... Loaded active tracking updates!`);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-left">
      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <button onClick={onNavigateHome} className="hover:text-slate-700">Home</button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 font-semibold">Live Delivery Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Real-Time Delivery Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#003d29] border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live GPS Sync
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateAdvance}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#003d29] bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
            title="Simulate courier location update in real-time"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Update Live Location</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tracking Details & Map, Right Recipient & Courier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Progress Bar, Courier Badge, Checkpoints, Map Preview */}
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
                  <div className="text-xs text-slate-400 font-medium">Carrier & Service</div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {currentShipment.courier_name}
                  </h3>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {currentShipment.courier_service}
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs text-slate-400 font-medium">Tracking Number (AWB)</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    {currentShipment.tracking_number}
                  </span>
                  <button
                    onClick={handleCopyTracking}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#003d29] hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Copy tracking code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Status Highlight */}
            <div className="p-4 rounded-2xl bg-[#003d29]/5 border border-[#003d29]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#003d29]">
                  Live Location Status
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {currentShipment.status_label}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-[#003d29] shrink-0" />
                  <span>Current GPS Pin: {currentShipment.current_location}</span>
                </div>
              </div>

              <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Arrival</div>
                <div className="text-sm sm:text-base font-extrabold text-[#003d29]">
                  {currentShipment.estimated_arrival}
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="pt-2">
              <div className="relative flex items-center justify-between mb-2">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-0"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-[#003d29] -translate-y-1/2 transition-all duration-500 -z-0"
                  style={{ width: `${(Math.min(currentStep, 4) / 4) * 100}%` }}
                ></div>

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
                    <div key={idx} className="flex flex-col items-center relative z-10">
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
                        className={`text-[11px] mt-2 hidden sm:block font-semibold ${
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

            {/* Simulated Live Route / Map Visual */}
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 text-white overflow-hidden shadow-sm">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold tracking-wide uppercase text-emerald-400">
                    Satellite Live Telemetry
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Transit Speed: <span className="text-white font-bold">42 mph</span> · Signal: <span className="text-emerald-400 font-bold">Strong 5G</span>
                </div>
              </div>

              {/* Waypoints visual */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">From Origin:</div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>{currentShipment.origin_address}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400">Destination:</div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{currentShipment.delivery_address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Tracking Timeline */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Live Activity Timeline
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
              Assigned Courier Specialist
            </h3>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#003d29] text-white font-bold text-sm flex items-center justify-center shadow-md">
                MV
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {currentShipment.driver_name || 'Courier Specialist'}
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
                <span>Call Driver</span>
              </a>
              <button
                onClick={() => alert(`Contacting ${currentShipment.driver_name}: "Driver is currently navigating with high focus. Will deliver package on schedule."`)}
                className="flex-1 py-2.5 px-3 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          </div>

          {/* Delivery Recipient & Destination Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-3.5 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Delivery Details
            </h3>

            <div>
              <div className="text-[11px] text-slate-400 font-medium">Recipient</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {currentShipment.recipient_name}
              </div>
              <div className="text-slate-500">{currentShipment.recipient_phone}</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Shipping Address</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {currentShipment.delivery_address}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Order Number</div>
              <div className="font-bold text-slate-900 mt-0.5">
                #{currentShipment.order_number}
              </div>
            </div>
          </div>

          {/* Parcel Items in Shipment */}
          {currentShipment.items_preview && currentShipment.items_preview.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-3.5 text-xs">
              <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                Package Contents ({currentShipment.items_preview.length} items)
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
                        Qty: {item.quantity} {item.color ? `· Color: ${item.color}` : ''}
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
              Protected by Shopcart Contactless Guarantee. 100% insured during transit.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
