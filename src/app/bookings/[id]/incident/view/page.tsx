// src/app/bookings/[id]/incident/view/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/apiClient';
import IncidentDetailsDisplay from '@/app/components/incident/IncidentDetailsDisplay';
import { IncidentReportDetails } from '@/app/types/incident';
import { Loader2, AlertCircle, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

function IncidentViewPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const bookingId = params.id as string;
    const bookingIdNum = parseInt(bookingId, 10);

    const [reports, setReports] = useState<IncidentReportDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    const highlightId = searchParams.get('highlight');
    const highlightedReportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isNaN(bookingIdNum)) {
            setError("ID de réservation invalide.");
            setIsLoading(false);
            return;
        }

        const fetchReportsAndAccess = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Récupérer les rapports d'incident
                const data = await apiClient.getIncidentReportsForBooking(bookingIdNum);
                setReports(data || []);

                // 2. Vérifier le rôle de l'utilisateur sur cette réservation
                const bookingData = await apiClient.get(`/api/bookings/${bookingIdNum}/access`);
                const foundOwnerId = bookingData?.vehicle?.owner?.id ?? null;
                
                if (foundOwnerId !== null && user?.id !== undefined) {
                    setIsOwner(Number(user.id) === Number(foundOwnerId));
                }

                // ✅ Scroll vers le rapport highlighté APRÈS le chargement
                if (highlightId && data && data.length > 0) {
                    setTimeout(() => {
                        const element = document.getElementById(`incident-${highlightId}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Ajouter une classe temporaire pour le highlight visuel
                            element.classList.add('ring-4', 'ring-primary', 'ring-offset-4', 'transition-all', 'duration-1000', 'ease-out');
                            setTimeout(() => {
                                element.classList.remove('ring-4', 'ring-primary', 'ring-offset-4', 'transition-all', 'duration-1000', 'ease-out');
                            }, 4000); // Retirer le highlight après 4 secondes
                        }
                    }, 300);
                }

            } catch (err: unknown) {
                 if (err instanceof ApiError && err.status === 403) {
                     setError("Accès refusé. Vous n'êtes pas autorisé à voir ces rapports.");
                 } else if (err instanceof ApiError && err.status === 404) {
                     setError("Réservation non trouvée.");
                 } else {
                    console.error("Error fetching incident reports:", err);
                    setError(err instanceof Error ? err.message : "Impossible de charger les rapports d'incidents.");
                 }
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchReportsAndAccess();
        }
    }, [bookingIdNum, highlightId, user]);

     const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="ml-3 text-muted-foreground">Chargement des rapports...</p>
                </div>
            );
        }

        if (error) {
             return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            );
        }

         if (reports.length === 0) {
             return (
                 <div className="text-center py-10 bg-muted rounded-lg">
                     <p className="text-muted-foreground mb-4">Aucun rapport d&apos;incident trouvé pour cette réservation.</p>
                      <Link
                        href={`/bookings/${bookingId}/incident/report`}
                         className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      >
                         <PlusCircle className="w-4 h-4 mr-2"/>
                         Signaler un nouvel incident
                     </Link>
                 </div>
             );
         }

        return (
            <div className="space-y-6">
                {reports.map(report => (
                    <div 
                        key={report.id} 
                        id={`incident-${report.id}`}
                        ref={report.id.toString() === highlightId ? highlightedReportRef : null}
                        className="rounded-xl"
                    >
                        <IncidentDetailsDisplay report={report} />
                    </div>
                ))}
            </div>
        );
     };

    return (
         <div className="min-h-screen bg-background">
             <div className="bg-card border-b border-border">
                <div className="container mx-auto max-w-4xl px-4 py-4">
                     <button
                        onClick={() => router.push(isOwner ? '/dashboard/owner' : '/bookings/my-bookings')}
                        className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
                     >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        {isOwner ? 'Retour au Tableau de bord' : 'Retour à mes réservations'}
                     </button>
                </div>
            </div>
             <div className="container mx-auto max-w-2xl py-8 px-4">
                 <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Rapport(s) d&apos;Incident</h1>
                 {renderContent()}
             </div>
        </div>
    );
}

export default function IncidentViewPage() {
     return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <IncidentViewPageContent />
        </Suspense>
    );
}