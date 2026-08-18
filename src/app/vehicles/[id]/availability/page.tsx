// src/app/vehicles/[id]/availability/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Calendar from 'react-calendar';
import { apiClient, ApiError } from '@/lib/apiClient';
import { BlockedPeriod, CreateBlockedPeriodData } from '@/types/availability';
import { Booking } from '@/types/booking';
import { Loader2, AlertCircle, ArrowLeft, CalendarPlus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';

// Helper type for calendar tile content
type TileContentData = {
    isBooked: boolean;
    isBlocked: boolean;
};

// Internal component using client hooks
function AvailabilityPageContent() {
    const t = useTranslations('vehicles.availability');
    const router = useRouter();
    const params = useParams();
    const { user, isLoading: isAuthLoading } = useAuth();

    const vehicleId = params.id as string;
    const vehicleIdNum = parseInt(vehicleId, 10);

    const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for adding new blocked periods
    const [selectedDates, setSelectedDates] = useState<Date | [Date, Date] | null>(null);
    const [reason, setReason] = useState('');
    const [isAddingBlock, setIsAddingBlock] = useState(false);
    const [addBlockError, setAddBlockError] = useState<string | null>(null);

    // react-calendar reports a same-day re-click as a zero-length [A, A] range
    // (not null) — treat that as "cancel selection" instead of a 1-day range.
    const handleCalendarChange = (value: Date | [Date | null, Date | null] | null) => {
        if (
            Array.isArray(value) &&
            value[0] &&
            value[1] &&
            value[0].getFullYear() === value[1].getFullYear() &&
            value[0].getMonth() === value[1].getMonth() &&
            value[0].getDate() === value[1].getDate()
        ) {
            setSelectedDates(null);
            return;
        }
        setSelectedDates(value as Date | [Date, Date] | null);
    };

    // Helper function to convert Date range to LocalDateTime strings
    const formatRangeToISO = (dates: [Date, Date]): { start: string, end: string } | null => {
        const [start, end] = dates;
        if (!start || !end) return null;

        // Ensure start is before end
        const startDate = start < end ? start : end;
        const endDate = start < end ? end : start;

        // Format to LocalDateTime ISO string (YYYY-MM-DDTHH:mm:ss)
        const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T00:00:00`;
        const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`;

        return { start: startISO, end: endISO };
    };

    const fetchData = useCallback(async () => {
        if (isNaN(vehicleIdNum) || !user) return;

        setIsLoading(true);
        setError(null);
        try {
            // ✅ Fetch blocks AND bookings using the CORRECT endpoint
            const [blocksData, bookingsData] = await Promise.all([
                apiClient.getBlockedPeriods(vehicleIdNum),
                apiClient.getBookingsForVehicle(vehicleIdNum) // ✅ Utilise la nouvelle méthode
            ]);
            setBlockedPeriods(blocksData || []);
            setBookings(bookingsData || []);
            console.log("Fetched blocks:", blocksData);
            console.log("Fetched bookings:", bookingsData);
        } catch (err: unknown) {
            console.error("Error fetching availability data:", err);
            if (err instanceof ApiError && err.status === 403) {
                setError(t('errors.accessDenied'));
            } else {
                setError(err instanceof Error ? err.message : t('errors.loadError'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [vehicleIdNum, user, t]);

    // Fetch data on mount and when user loads
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchData();
        } else if (!isAuthLoading && !user) {
            // Redirect if not logged in after auth check
            router.push(`/login?redirect=/vehicles/${vehicleId}/availability`);
        }
    }, [vehicleIdNum, isAuthLoading, user, fetchData, router, vehicleId]);

    const handleAddBlockedPeriod = async () => {
        if (!selectedDates || !Array.isArray(selectedDates)) {
            setAddBlockError(t('errors.selectPeriod'));
            return;
        }

        const formattedDates = formatRangeToISO(selectedDates);
        if (!formattedDates) {
            setAddBlockError(t('errors.invalidDates'));
            return;
        }

        setAddBlockError(null);
        setIsAddingBlock(true);

        const blockData: CreateBlockedPeriodData = {
            startDate: formattedDates.start,
            endDate: formattedDates.end,
            reason: reason || undefined,
        };

        try {
            await apiClient.addBlockedPeriod(vehicleIdNum, blockData);
            fetchData();
            setSelectedDates(null);
            setReason('');
        } catch (err: unknown) {
            console.error("Error adding blocked period:", err);
            setAddBlockError(err instanceof Error ? err.message : t('errors.addError'));
        } finally {
            setIsAddingBlock(false);
        }
    };

    const handleDeleteBlockedPeriod = async (periodId: number) => {
        if (!confirm(t('confirmDeleteBlock'))) return;

        try {
            await apiClient.deleteBlockedPeriod(vehicleIdNum, periodId);
            fetchData();
        } catch (err: unknown) {
            console.error("Error deleting blocked period:", err);
            setError(t('errors.deleteError'));
        }
    };

    // Function to determine tile content/class
    const tileClassName = ({ date, view }: { date: Date; view: string }): string | null => {
        if (view !== 'month') return null;

        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Check Bookings (Confirmed or In Progress)
        const isBooked = bookings.some(booking => {
            if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') return false;
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const bookingStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const bookingEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            bookingEnd.setHours(23, 59, 59, 999);
            return dateOnly >= bookingStart && dateOnly <= bookingEnd;
        });

        // Check Blocked Periods
        const isBlocked = blockedPeriods.some(period => {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            const blockStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const blockEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            blockEnd.setHours(23, 59, 59, 999);
            return dateOnly >= blockStart && dateOnly <= blockEnd;
        });

        if (isBooked) return 'booked-day';
        if (isBlocked) return 'blocked-day';

        return null;
    };

    // --- Render Logic ---
    if (isLoading || isAuthLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    const selectedRangeText = Array.isArray(selectedDates)
        ? `${selectedDates[0].toLocaleDateString()} - ${selectedDates[1].toLocaleDateString()}`
        : selectedDates instanceof Date ? selectedDates.toLocaleDateString() : t('noPeriodSelected');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto max-w-6xl px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        {t('back')}
                    </button>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl py-8 px-4">
                <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
                    {t('title', { id: vehicleId })}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Calendar View */}
                    <div className="md:col-span-2 bg-card p-6 rounded-lg shadow-md border border-border">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">{t('calendarTitle')}</h2>
                        <Calendar
                            onChange={handleCalendarChange}
                            value={selectedDates}
                            selectRange={true}
                            tileClassName={tileClassName}
                            minDate={new Date()}
                            className="w-full border-none shadow-none p-0"
                        />
                        <div className="mt-4 flex space-x-2 items-center text-xs">
                            <span className="w-3 h-3 bg-red-200 dark:bg-red-800/50 rounded-full inline-block"></span>
                            <span className="text-muted-foreground">{t('legendBooked')}</span>
                            <span className="w-3 h-3 bg-gray-300 dark:bg-gray-700/50 rounded-full inline-block ml-3"></span>
                            <span className="text-muted-foreground">{t('legendBlocked')}</span>
                        </div>
                    </div>

                    {/* Add/List Blocked Periods */}
                    <div className="space-y-6">
                        {/* Add Block Form */}
                        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
                                <CalendarPlus className="w-5 h-5 mr-2 text-primary" />
                                {t('blockFormTitle')}
                            </h2>
                            {addBlockError && (
                                <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm mb-3 flex items-start" role="alert">
                                    <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                                    <span>{addBlockError}</span>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    {t('selectedPeriodLabel')}
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={selectedRangeText}
                                    className="w-full px-3 py-1.5 border border-border bg-muted rounded-md text-sm text-foreground"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground mb-1">
                                    {t('reasonLabel')}
                                </label>
                                <input
                                    id="reason"
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t('reasonPlaceholder')}
                                    className="w-full px-3 py-1.5 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <button
                                onClick={handleAddBlockedPeriod}
                                disabled={isAddingBlock || !selectedDates || !Array.isArray(selectedDates)}
                                className="w-full flex items-center justify-center py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isAddingBlock ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                {isAddingBlock ? t('blocking') : t('blockButton')}
                            </button>
                        </div>

                        {/* List Blocked Periods */}
                        <div className="bg-card p-6 rounded-lg shadow-md border border-border">
                            <h2 className="text-xl font-semibold mb-4 text-foreground">{t('blockedListTitle')}</h2>
                            {blockedPeriods.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('noBlockedPeriods')}</p>
                            ) : (
                                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {blockedPeriods.map(period => (
                                        <li key={period.id} className="flex justify-between items-center p-3 bg-muted rounded">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                                </p>
                                                {period.reason && <p className="text-xs text-muted-foreground">{period.reason}</p>}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBlockedPeriod(period.id)}
                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                                title={t('deleteTitle')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export with Suspense
export default function AvailabilityPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <AvailabilityPageContent />
        </Suspense>
    );
}