// lib/exportPdf.ts
//
// Génère un PDF lisible à partir de la réponse de GET /api/users/me/export
// (droit à la portabilité des données). Le backend renvoie du JSON structuré —
// c'est ce module qui le met en forme pour un humain plutôt que de faire
// télécharger le JSON brut, illisible pour qui n'est pas développeur.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProfileExport {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  role?: string;
  premium?: boolean;
  premiumEndDate?: string;
  identityVerified?: boolean;
  drivingLicenseVerified?: boolean;
  selfieVerified?: boolean;
  verificationStatus?: string;
  availableBalance?: number;
  pendingBalance?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

interface BookingExport {
  id: number;
  vehicleMake?: string;
  vehicleModel?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  status?: string;
  createdAt?: string;
}

interface VehicleExport {
  id: number;
  make?: string;
  model?: string;
  status?: string;
  ratePerDay?: number;
  createdAt?: string;
}

interface ReviewExport {
  id: number;
  vehicleMake?: string;
  vehicleModel?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface UserDataExport {
  exportedAt?: string;
  profile: ProfileExport;
  bookings: BookingExport[];
  vehiclesOwned: VehicleExport[];
  reviews: ReviewExport[];
}

const BRAND_GREEN: [number, number, number] = [27, 107, 74]; // #1B6B4A, vert Kibira
const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];

const formatDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatPrice = (value?: number): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-BI').format(value) + ' FBu';
};

const yesNo = (value?: boolean): string => (value ? 'Oui' : 'Non');

export function generateDataExportPdf(data: UserDataExport): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 20;

  // ── En-tête ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BRAND_GREEN);
  doc.text('BudaxDrive', marginX, y);

  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text('Export de vos données personnelles', marginX, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Généré le ${formatDate(data.exportedAt ?? new Date().toISOString())}`, marginX, y);

  y += 2;
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  // ── Profil ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text('Profil', marginX, y);
  y += 7;

  const p = data.profile;
  const profileRows: [string, string][] = [
    ['Nom', [p.firstName, p.lastName].filter(Boolean).join(' ') || '—'],
    ['Email', p.email ?? '—'],
    ['Téléphone', p.phoneNumber ?? '—'],
    ['Entreprise', p.companyName ?? '—'],
    ['Rôle', p.role ?? '—'],
    ['Compte Premium', yesNo(p.premium) + (p.premium && p.premiumEndDate ? ` (jusqu'au ${formatDate(p.premiumEndDate)})` : '')],
    ['Identité vérifiée', yesNo(p.identityVerified)],
    ['Permis vérifié', yesNo(p.drivingLicenseVerified)],
    ['Selfie vérifié', yesNo(p.selfieVerified)],
    ['Statut de vérification', p.verificationStatus ?? '—'],
    ['Solde disponible', formatPrice(p.availableBalance)],
    ['Solde en attente', formatPrice(p.pendingBalance)],
    ['Compte créé le', formatDate(p.createdAt)],
    ['Dernière connexion', formatDate(p.lastLoginAt)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: { fontSize: 10, textColor: INK, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: MUTED } },
    body: profileRows,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  const ensureRoom = (rowsCount: number) => {
    // Marge de sécurité : si la section ne tient manifestement pas, on passe à
    // une nouvelle page plutôt que de laisser autoTable la couper n'importe où.
    const estimatedHeight = 15 + rowsCount * 8;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + estimatedHeight > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title, marginX, y);
    y += 7;
  };

  // ── Réservations ─────────────────────────────────────────────────────
  ensureRoom(data.bookings.length);
  sectionTitle(`Réservations (${data.bookings.length})`);

  if (data.bookings.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('Aucune réservation.', marginX, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Véhicule', 'Du', 'Au', 'Prix', 'Statut']],
      body: data.bookings.map((b) => [
        [b.vehicleMake, b.vehicleModel].filter(Boolean).join(' ') || '—',
        formatDate(b.startDate),
        formatDate(b.endDate),
        formatPrice(b.totalPrice),
        b.status ?? '—',
      ]),
      headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [243, 244, 246] },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Véhicules possédés (uniquement si propriétaire) ────────────────
  if (data.vehiclesOwned.length > 0) {
    ensureRoom(data.vehiclesOwned.length);
    sectionTitle(`Véhicules possédés (${data.vehiclesOwned.length})`);

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Véhicule', 'Statut', 'Prix / jour']],
      body: data.vehiclesOwned.map((v) => [
        [v.make, v.model].filter(Boolean).join(' ') || '—',
        v.status ?? '—',
        formatPrice(v.ratePerDay),
      ]),
      headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [243, 244, 246] },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Avis rédigés ─────────────────────────────────────────────────────
  ensureRoom(data.reviews.length);
  sectionTitle(`Avis rédigés (${data.reviews.length})`);

  if (data.reviews.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('Aucun avis rédigé.', marginX, y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Véhicule', 'Note', 'Commentaire', 'Date']],
      body: data.reviews.map((r) => [
        [r.vehicleMake, r.vehicleModel].filter(Boolean).join(' ') || '—',
        `${r.rating}/5`,
        r.comment ?? '—',
        formatDate(r.createdAt),
      ]),
      headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: INK },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      columnStyles: { 2: { cellWidth: 70 } },
    });
  }

  // ── Pied de page (numéro de page) ────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `BudaxDrive — Export de données personnelles — Page ${i}/${pageCount}`,
      marginX,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const dateSuffix = new Date().toISOString().split('T')[0];
  doc.save(`budaxdrive-mes-donnees-${dateSuffix}.pdf`);
}
