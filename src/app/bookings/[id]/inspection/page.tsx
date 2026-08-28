// src/app/bookings/[id]/inspection/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient, ApiError } from '@/lib/apiClient';
import CheckInForm from '@/app/components/inspection/CheckInForm';
import CheckOutForm from '@/app/components/inspection/CheckOutForm';
import InspectionDetailsDisplay from '@/app/components/inspection/InspectionDetailsDisplay';
import { InspectionDetails } from '@/types/inspection';
import { Loader2, AlertCircle, ArrowLeft, Lock, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function InspectionPageContent() {
    const t = useTranslations('inspection.page');
    const router = useRouter();
    const params = useParams();
    const { user, isLoading: isAuthLoading } = useAuth();

    const bookingId = params.id as string;
    const bookingIdNum = parseInt(bookingId, 10);

    const [inspectionDetails, setInspectionDetails] = useState<InspectionDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentBookingStatus, setCurrentBookingStatus] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<number | null>(null);
    const [renterId, setRenterId] = useState<number | null>(null);
    const [checkInPin, setCheckInPin] = useState<string | null>(null);

    // ✅ Toast de succès géré dans le parent — survit au démontage du formulaire
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const fetchInspectionDetails = async () => {
        if (isNaN(bookingIdNum)) {
            setError(t('invalidBookingId'));
            setIsLoading(false);
            return;
        }
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            // ✅ On utilise le nouvel endpoint /access qui retourne renter + vehicle.owner + checkInCode
            // L'ancien endpoint GET /api/bookings/{id} est inchangé et continue de fonctionner pour les autres pages
            const bookingData = await apiClient.get(`/api/bookings/${bookingIdNum}/access`);

            setCurrentBookingStatus(bookingData.status);

            // Les IDs sont maintenant garantis dans la réponse
            const foundOwnerId = bookingData?.vehicle?.owner?.id ?? null;
            const foundRenterId = bookingData?.renter?.id ?? null;

            setOwnerId(foundOwnerId !== null ? Number(foundOwnerId) : null);
            setRenterId(foundRenterId !== null ? Number(foundRenterId) : null);
            setCheckInPin(bookingData.checkInCode ?? null);

            console.log("🔍 Accès inspection :", {
                utilisateur: user.id,
                proprietaire: foundOwnerId,
                locataire: foundRenterId,
                isOwner: Number(user.id) === Number(foundOwnerId),
                isRenter: Number(user.id) === Number(foundRenterId),
                status: bookingData.status,
                checkInCode: bookingData.checkInCode,
            });

            // Récupérer les détails de l'inspection si la réservation le permet
            if (['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(bookingData.status)) {
                try {
                    const data = await apiClient.getInspectionDetails(bookingIdNum);
                    setInspectionDetails(data);
                } catch (inspErr: unknown) {
                    if (inspErr instanceof ApiError && inspErr.status === 404) {
                        setInspectionDetails(null); // Pas encore d'inspection — normal
                    } else {
                        throw inspErr;
                    }
                }
            } else {
                setInspectionDetails(null);
            }

        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 403) {
                setError(t('accessDenied'));
            } else if (err instanceof Error) {
                setError(err.message || t('loadError'));
            } else {
                setError(t('loadError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchInspectionDetails();
        } else if (!isAuthLoading && !user) {
            router.push(`/login?redirect=/bookings/${bookingId}/inspection`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingIdNum, isAuthLoading, user]);

    const handleCheckInSuccess = (_record: unknown) => { fetchInspectionDetails(); };
    const handleCheckOutSuccess = (_record: unknown) => { fetchInspectionDetails(); };

    // Conversion explicite en Number pour éviter "5" === 5 → false
    const isOwner = ownerId !== null && Number(user?.id) === Number(ownerId);
    const isRenter = renterId !== null && Number(user?.id) === Number(renterId);

    const renderContent = () => {
        if (isLoading || isAuthLoading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">{t('loading')}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            );
        }

        // 1. Check-out terminé → rapport complet
        if (inspectionDetails?.checkOutId) {
            return <InspectionDetailsDisplay details={inspectionDetails} />;
        }

        // 2. Check-in fait, location en cours → formulaire de check-out (SEULEMENT pour le locataire)
        if (inspectionDetails?.checkInId && !inspectionDetails.checkOutId && currentBookingStatus === 'IN_PROGRESS') {
            if (isRenter) {
                // ✅ Seul le locataire voit le formulaire
                return (
                    <>
                        <h2 className="text-2xl font-semibold mb-6 text-foreground">{t('checkOutTitle')}</h2>
                        <CheckOutForm
                            bookingId={bookingIdNum}
                            onCheckOutSuccess={handleCheckOutSuccess}
                            mileageStart={inspectionDetails.mileageStart}
                        />
                    </>
                );
            } else if (isOwner) {
                // ✅ Le propriétaire voit un message d'attente sécurisé
                return (
                    <div className="text-center py-10 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg">
                        <Lock className="w-12 h-12 text-primary mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">{t('inProgressOwnerTitle')}</h3>
                        <p className="text-muted-foreground px-4">
                            {t('inProgressOwnerDesc')}
                        </p>
                    </div>
                );
            }
        }

        // 3. Pas encore de check-in, réservation CONFIRMED → vue propriétaire ou locataire
        if (!inspectionDetails?.checkInId && currentBookingStatus === 'CONFIRMED') {
            return (
                <div className="space-y-6">
                    {isOwner ? (
                        // ✅ VUE PROPRIÉTAIRE : Formulaire avec saisie du code locataire
                        <>
                            <h2 className="text-2xl font-semibold mb-6 text-foreground">{t('checkInTitle')}</h2>
                            <CheckInForm
                                bookingId={bookingIdNum}
                                onCheckInSuccess={(_record) => {
                                    // 1. Afficher le toast immédiatement
                                    setShowSuccessToast(true);
                                    // 2. Attendre 3.5s AVANT de re-fetcher — sinon la page change
                                    //    et démonte le formulaire avant que le toast soit lisible
                                    setTimeout(() => {
                                        setShowSuccessToast(false);
                                        router.push('/dashboard/owner');
                                    }, 3500);
                                }}
                            />
                        </>
                    ) : isRenter ? (
                        // ✅ VUE LOCATAIRE : Code secret à communiquer au propriétaire
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-8 text-center">
                            <h2 className="text-2xl font-bold text-primary mb-2">{t('renterCodeTitle')}</h2>
                            <p className="text-muted-foreground mb-6">
                                {t('renterCodeDesc')}
                            </p>
                            <div className="text-5xl tracking-widest font-mono font-bold text-foreground bg-background py-4 rounded-md shadow-inner inline-block px-8">
                                {checkInPin ?? "—"}
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4" /> {t('renterCodeHint')}
                            </p>
                        </div>
                    ) : (
                        // Ni propriétaire ni locataire
                        <div className="text-center py-10 bg-muted rounded-lg border border-red-200">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">{t('unauthorizedTitle')}</h3>
                            <p className="text-muted-foreground">{t('unauthorizedDesc')}</p>
                        </div>
                    )}
                </div>
            );
        }

        // 4. Check-in existant mais statut pas IN_PROGRESS
        if (inspectionDetails?.checkInId && !inspectionDetails.checkOutId && currentBookingStatus !== 'IN_PROGRESS') {
            return (
                <>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('checkInDetailsTitle')}</h2>
                    <p className="mb-6 text-muted-foreground">{t('checkOutNotAvailable')}</p>
                    <InspectionDetailsDisplay details={inspectionDetails} />
                </>
            );
        }

        // 5. Statut différent de CONFIRMED, pas de check-in
        if (!inspectionDetails?.checkInId && currentBookingStatus !== 'CONFIRMED') {
            return (
                <div className="text-center py-10 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                        {t('checkInNotAvailable', { status: currentBookingStatus || 'N/A' })}
                    </p>
                </div>
            );
        }

        return <div className="text-center py-10"><p className="text-muted-foreground">{t('notDetermined')}</p></div>;
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-card border-b border-border">
                <div className="container mx-auto max-w-4xl px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        {t('back')}
                    </button>
                </div>
            </div>
            <div className="container mx-auto max-w-2xl py-8 px-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                    {t('pageTitle', { id: bookingId })}
                </h1>
                {renderContent()}
            </div>

            {/* ✅ TOAST DE SUCCÈS DANS LE PARENT — survit au démontage du formulaire */}
            {showSuccessToast && (
                <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">{t('checkInSuccessTitle')}</p>
                        <p className="text-xs text-green-100 mt-0.5">{t('checkInSuccessDesc')}</p>
                    </div>
                    <button
                        onClick={() => setShowSuccessToast(false)}
                        className="ml-2 text-green-200 hover:text-white transition-colors p-2 -m-2"
                        aria-label={t('closeAria')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function InspectionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <InspectionPageContent />
        </Suspense>
    );
}