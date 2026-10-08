/**
 * Centralized Indonesian Rupiah Currency Formatter for PASARIA.
 * Examples: formatRupiah(10000) => "Rp10.000"
 *           formatRupiah(1250000) => "Rp1.250.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp0';
  }
  const numeric = Math.round(Number(amount));
  return 'Rp' + numeric.toLocaleString('id-ID');
}

/**
 * Format date time to Indonesian locale.
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}
