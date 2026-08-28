// src/app/bookings/[id]/incident/report/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/apiClient';
import IncidentReportForm from '@/app/components/incident/IncidentReportForm';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

function IncidentReportPageContent() {
    const t = useTranslations('incident.report');
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();

    const bookingId = params.id as string;
    const bookingIdNum = parseInt(bookingId, 10);

    const [isReportSubmitted, setIsReportSubmitted] = useState(false);
    const [submittedReportId, setSubmittedReportId] = useState<number | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);

    // Vérifier le rôle de l'utilisateur au chargement
    useEffect(() => {
        const checkUserRole = async () => {
            setIsCheckingRole(true);
            try {
                const bookingData = await apiClient.get(`/api/bookings/${bookingIdNum}/access`);
                const foundOwnerId = bookingData?.vehicle?.owner?.id ?? null;
                
                if (foundOwnerId !== null && user?.id !== undefined) {
                    setIsOwner(Number(user.id) === Number(foundOwnerId));
                }
            } catch (err: unknown) {
                console.error("Error checking user role:", err);
            } finally {
                setIsCheckingRole(false);
            }
        };

        if (user && !isNaN(bookingIdNum)) {
            checkUserRole();
        } else {
            setIsCheckingRole(false);
        }
    }, [bookingIdNum, user]);

    const handleReportSuccess = (report: { id: number }) => {
        // 1. On affiche le Pop-up vert immédiatement
        setShowSuccessToast(true);
        
        // 2. On attend 3 secondes pour que l'utilisateur puisse le lire
        setTimeout(() => {
            setShowSuccessToast(false);
            // 3. On bascule l'écran vers le résumé
            setIsReportSubmitted(true);
            setSubmittedReportId(report.id);
        }, 3000);
    };

    if (isNaN(bookingIdNum)) {
        return (
             <div className="text-center py-10 text-red-600">
                {t('invalidBookingId')}
             </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
             <div className="bg-card border-b border-border">
                <div className="container mx-auto max-w-4xl px-4 py-4">
                     <button
                        onClick={() => router.push(isOwner ? '/dashboard/owner' : '/bookings/my-bookings')}
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
                     >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        {isOwner ? t('backToDashboard') : t('backToBookings')}
                     </button>
                </div>
            </div>
            <div className="container mx-auto max-w-2xl py-8 px-4">
                <div className="text-center mb-8">
                     <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3"/>
                     <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('pageTitle')}</h1>
                     <p className="text-muted-foreground">{t('forBooking', { id: bookingId })}</p>
                </div>

                {isReportSubmitted ? (
                    <div className="bg-white dark:bg-gray-800 border-2 border-green-600 dark:border-green-500 rounded-lg p-8 text-center shadow-lg">
                        {/* Icône de succès */}
                        <div className="bg-green-100 dark:bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        
                        {/* Titre */}
                        <h2 className="font-bold text-2xl mb-3 text-gray-900 dark:text-gray-100">
                            {t('successTitle')}
                        </h2>

                        {/* Message */}
                        <p className="text-gray-700 dark:text-gray-300 mb-6 text-base">
                            {t('successMessage', { id: submittedReportId ?? '' })}
                            <br />
                            {t('successMessageLine2')}
                        </p>

                        {/* Boutons d'action */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={`/bookings/${bookingId}/incident/view`}
                                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
                            >
                                {t('viewReport')}
                            </Link>
                            <Link
                                href={isOwner ? '/dashboard/owner' : '/bookings/my-bookings'}
                                className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium px-6 py-3 rounded-lg transition-colors"
                            >
                                {isOwner ? t('backToDashboard') : t('backToBookings')}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card p-8 rounded-lg shadow-md border border-border">
                        <IncidentReportForm
                            bookingId={bookingIdNum}
                            onReportSuccess={handleReportSuccess}
                        />
                    </div>
                )}

                {/* Pop-up de succès flottant - s'affiche après l'envoi réussi */}
                {showSuccessToast && (
                    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">{t('toastTitle')}</p>
                            <p className="text-xs text-green-100 mt-0.5">{t('toastMessage')}</p>
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
        </div>
    );
}

export default function IncidentReportPage() {
     return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <IncidentReportPageContent />
        </Suspense>
    );
}