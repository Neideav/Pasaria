import React, { useState, useEffect } from 'react';
import { DeliveryView } from '../components/DeliveryView';
import { Order, DeliveryShipment } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

interface DeliveryPageProps {
  code?: string;
}

export function DeliveryPage({ code }: DeliveryPageProps) {
  const { user, activeShipment, setActiveShipment } = useAppContext();

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (code) {
      loadShipmentByCode(code);
    } else if (user?.id) {
      loadDeliveries(user.id);
    }
    if (user?.id) {
      loadOrders(user.id);
    }
  }, [code, user?.id]);

  const loadShipmentByCode = async (trackingCode: string) => {
    try {
      const shipment = await api.getDeliveryByCode(trackingCode);
      if (shipment) {
        setActiveShipment(shipment as DeliveryShipment);
      }
    } catch (err) {
      console.warn('Load shipment by code error:', err);
    }
  };

  const loadDeliveries = async (uid: number) => {
    try {
      const shipments = await api.getDeliveries(uid);
      if (shipments && shipments.length > 0) {
        setActiveShipment(shipments[0]);
      }
    } catch (_) {}
  };

  const loadOrders = async (uid: number) => {
    try {
      const ords = await api.getOrders(uid);
      setOrders(ords || []);
    } catch (_) {}
  };

  return (
    <DeliveryView
      activeShipment={activeShipment}
      orders={orders}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onSelectProductBySlug={(slug) => {
        window.location.href = '/products/' + slug;
      }}
    />
  );
}

