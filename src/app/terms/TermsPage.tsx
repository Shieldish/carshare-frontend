'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Shield, Users, Car, CreditCard, AlertTriangle, FileText, Phone, Mail, Globe } from 'lucide-react';

type DocLang = 'fr' | 'en';

const content: Record<DocLang, {
  lastUpdated: string;
  intro: { title: string; p1: string; p2: string; p3: string };
  definitions: { title: string; owner: string; ownerDesc: string; renter: string; renterDesc: string; vehicle: string; vehicleDesc: string; booking: string; bookingDesc: string };
  accounts: { title: string; sub1Title: string; sub1Items: string[]; sub2Title: string; sub2Items: string[] };
  rentals: { title: string; sub1Title: string; sub1Items: string[]; sub2Title: string; sub2Items: string[]; sub3Title: string; sub3Items: string[] };
  payments: { title: string; sub1Title: string; sub1Items: string[]; sub2Title: string; sub2Items: string[]; sub3Title: string; sub3Items: string[] };
  responsibilities: { title: string; sub1Title: string; sub1Items: string[]; sub2Title: string; sub2Items: string[]; sub3Title: string; sub3Items: string[] };
  cancellation: { title: string; headerDelay: string; headerRefund: string; rows: [string, string][] };
  prohibited: { title: string; strictlyTitle: string; strictlyItems: string[]; sanctionsTitle: string; sanctionsItems: string[] };
  contact: { title: string; phoneTitle: string; phoneHours: string; emailTitle: string; emailResponse: string };
  final: { title: string; p1: string; p2: string };
}> = {
  fr: {
    lastUpdated: "Dernière mise à jour : 15 septembre 2025",
    intro: {
      title: "1. Introduction",
      p1: "Bienvenue sur CarShare Burundi, la plateforme de location de véhicules entre particuliers au Burundi. En utilisant nos services, vous acceptez d'être lié par ces conditions d'utilisation.",
      p2: "CarShare Burundi (\"nous\", \"notre\", \"nos\") exploite le site web carshareburundi.com et l'application mobile CarShare Burundi (collectivement, le \"Service\").",
      p3: "Ces conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent ou utilisent le Service."
    },
    definitions: {
      title: "2. Définitions",
      owner: "Propriétaire", ownerDesc: "Personne physique qui met son véhicule personnel en location via la plateforme.",
      renter: "Locataire", renterDesc: "Personne physique qui loue un véhicule via la plateforme.",
      vehicle: "Véhicule", vehicleDesc: "Tout véhicule automobile proposé en location sur la plateforme.",
      booking: "Réservation", bookingDesc: "Contrat de location entre un propriétaire et un locataire via la plateforme."
    },
    accounts: {
      title: "3. Comptes Utilisateur",
      sub1Title: "3.1 Création de compte",
      sub1Items: ["Vous devez être âgé d'au moins 21 ans pour créer un compte", "Vous devez fournir des informations exactes et complètes", "Vous êtes responsable de la sécurité de votre mot de passe", "Un seul compte par personne est autorisé"],
      sub2Title: "3.2 Vérification d'identité",
      sub2Items: ["Pièce d'identité nationale ou passeport valide", "Permis de conduire en cours de validité", "Justificatif de domicile récent", "Photo de profil récente et claire"]
    },
    rentals: {
      title: "4. Location de Véhicules",
      sub1Title: "4.1 Conditions de location",
      sub1Items: ["Âge minimum : 21 ans (25 ans pour certains véhicules premium)", "Permis de conduire valide depuis au moins 2 ans", "Aucune suspension de permis en cours", "Carte bancaire valide pour la caution"],
      sub2Title: "4.2 Utilisation du véhicule",
      sub2Items: ["Usage personnel uniquement (pas commercial)", "Respect du code de la route du Burundi", "Interdiction de sous-location", "Nombre maximum de conducteurs : 2 (déclarés)", "Transport de matières dangereuses interdit"],
      sub3Title: "4.3 Restitution",
      sub3Items: ["Retour à l'heure et lieu convenus", "Véhicule dans le même état qu'au départ", "Réservoir de carburant au même niveau", "Restitution des clés et documents"]
    },
    payments: {
      title: "5. Paiements et Tarification",
      sub1Title: "5.1 Prix et frais",
      sub1Items: ["Prix fixés librement par les propriétaires", "Commission CarShare Burundi : 15% du montant de la location", "Frais de traitement des paiements inclus"],
      sub2Title: "5.2 Caution",
      sub2Items: ["Montant : 100 000 à 500 000 FBU selon le véhicule", "Préautorisation sur carte bancaire", "Libération automatique 7 jours après restitution", "Retenue en cas de dommages ou d'infractions"],
      sub3Title: "5.3 Moyens de paiement",
      sub3Items: ["Orange Money", "Eco Cash", "Cartes bancaires internationales", "Virements bancaires"]
    },
    responsibilities: {
      title: "6. Responsabilités",
      sub1Title: "6.1 Responsabilité du locataire",
      sub1Items: ["Utilisation conforme du véhicule", "Paiement des amendes et contraventions", "Signalement immédiat des dommages ou pannes", "Restitution dans les délais"],
      sub2Title: "6.2 Responsabilité du propriétaire",
      sub2Items: ["Véhicule en bon état de fonctionnement", "Contrôle technique à jour", "Assurance véhicule valide", "Information sur les spécificités du véhicule"],
      sub3Title: "6.3 Responsabilité de CarShare Burundi",
      sub3Items: ["Mise en relation entre propriétaires et locataires", "Traitement sécurisé des paiements", "Support client 7j/7", "Vérification d'identité et des documents des véhicules"]
    },
    cancellation: {
      title: "7. Annulation et Remboursement",
      headerDelay: "Délai d'annulation", headerRefund: "Remboursement",
      rows: [["Plus de 24h avant", "100% (gratuit)"], ["Entre 24h et 2h avant", "50%"], ["Moins de 2h avant", "Aucun remboursement"], ["Annulation propriétaire", "100%"]]
    },
    prohibited: {
      title: "8. Utilisations Interdites",
      strictlyTitle: "Strictement interdit :",
      strictlyItems: ["Usage commercial non déclaré", "Transport de passagers payants", "Conduite sous influence", "Courses automobiles", "Transport de matières illégales"],
      sanctionsTitle: "Sanctions :",
      sanctionsItems: ["Suspension de compte", "Résiliation définitive", "Poursuites judiciaires"]
    },
    contact: {
      title: "9. Contact et Support",
      phoneTitle: "Support Téléphonique", phoneHours: "Lundi - Dimanche : 7h - 22h",
      emailTitle: "Support Email", emailResponse: "Réponse sous 24h"
    },
    final: {
      title: "Modification des Conditions",
      p1: "CarShare Burundi se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés par email des modifications importantes.",
      p2: "L'utilisation continue du service après modification constitue l'acceptation des nouvelles conditions."
    }
  },
  en: {
    lastUpdated: "Last updated: September 15, 2025",
    intro: {
      title: "1. Introduction",
      p1: "Welcome to CarShare Burundi, the peer-to-peer vehicle rental platform in Burundi. By using our services, you agree to be bound by these terms of use.",
      p2: "CarShare Burundi (\"we\", \"our\", \"us\") operates the website carshareburundi.com and the CarShare Burundi mobile application (collectively, the \"Service\").",
      p3: "These terms apply to all visitors, users and other persons who access or use the Service."
    },
    definitions: {
      title: "2. Definitions",
      owner: "Owner", ownerDesc: "An individual who lists their personal vehicle for rental through the platform.",
      renter: "Renter", renterDesc: "An individual who rents a vehicle through the platform.",
      vehicle: "Vehicle", vehicleDesc: "Any motor vehicle offered for rental on the platform.",
      booking: "Booking", bookingDesc: "A rental contract between an owner and a renter through the platform."
    },
    accounts: {
      title: "3. User Accounts",
      sub1Title: "3.1 Account creation",
      sub1Items: ["You must be at least 21 years old to create an account", "You must provide accurate and complete information", "You are responsible for the security of your password", "Only one account per person is allowed"],
      sub2Title: "3.2 Identity verification",
      sub2Items: ["Valid national ID or passport", "Valid driving license", "Recent proof of address", "Recent and clear profile photo"]
    },
    rentals: {
      title: "4. Vehicle Rentals",
      sub1Title: "4.1 Rental conditions",
      sub1Items: ["Minimum age: 21 (25 for certain premium vehicles)", "Driving license valid for at least 2 years", "No current license suspension", "Valid bank card for the deposit"],
      sub2Title: "4.2 Vehicle use",
      sub2Items: ["Personal use only (not commercial)", "Compliance with Burundian traffic laws", "Subletting is prohibited", "Maximum number of drivers: 2 (declared)", "Transport of dangerous materials is prohibited"],
      sub3Title: "4.3 Return",
      sub3Items: ["Return at the agreed time and place", "Vehicle in the same condition as at departure", "Fuel tank at the same level", "Return of keys and documents"]
    },
    payments: {
      title: "5. Payments and Pricing",
      sub1Title: "5.1 Prices and fees",
      sub1Items: ["Prices freely set by owners", "CarShare Burundi commission: 15% of the rental amount", "Payment processing fees included"],
      sub2Title: "5.2 Deposit",
      sub2Items: ["Amount: 100,000 to 500,000 FBU depending on the vehicle", "Pre-authorization on bank card", "Automatic release 7 days after return", "Withheld in case of damage or violations"],
      sub3Title: "5.3 Payment methods",
      sub3Items: ["Orange Money", "Eco Cash", "International bank cards", "Bank transfers"]
    },
    responsibilities: {
      title: "6. Responsibilities",
      sub1Title: "6.1 Renter's responsibility",
      sub1Items: ["Proper use of the vehicle", "Payment of fines and traffic violations", "Immediate reporting of damage or breakdowns", "Timely return"],
      sub2Title: "6.2 Owner's responsibility",
      sub2Items: ["Vehicle in good working order", "Up-to-date technical inspection", "Valid vehicle insurance", "Information about the vehicle's specifics"],
      sub3Title: "6.3 CarShare Burundi's responsibility",
      sub3Items: ["Connecting owners and renters", "Secure payment processing", "Customer support 7 days a week", "Identity verification and vehicle document checks"]
    },
    cancellation: {
      title: "7. Cancellation and Refunds",
      headerDelay: "Cancellation notice", headerRefund: "Refund",
      rows: [["More than 24h before", "100% (free)"], ["Between 24h and 2h before", "50%"], ["Less than 2h before", "No refund"], ["Owner cancellation", "100%"]]
    },
    prohibited: {
      title: "8. Prohibited Uses",
      strictlyTitle: "Strictly prohibited:",
      strictlyItems: ["Undeclared commercial use", "Transporting paying passengers", "Driving under the influence", "Car racing", "Transporting illegal materials"],
      sanctionsTitle: "Sanctions:",
      sanctionsItems: ["Account suspension", "Permanent termination", "Legal proceedings"]
    },
    contact: {
      title: "9. Contact and Support",
      phoneTitle: "Phone Support", phoneHours: "Monday - Sunday: 7am - 10pm",
      emailTitle: "Email Support", emailResponse: "Response within 24h"
    },
    final: {
      title: "Changes to the Terms",
      p1: "CarShare Burundi reserves the right to modify these terms at any time. Users will be notified by email of significant changes.",
      p2: "Continued use of the service after modification constitutes acceptance of the new terms."
    }
  }
};

const TermsPage = () => {
  const siteLocale = useLocale();
  const tLegal = useTranslations('legal');
  const tPage = useTranslations('terms');
  const [docLang, setDocLang] = useState<DocLang>(siteLocale === 'en' ? 'en' : 'fr');
  const c = content[docLang];
  const needsNotice = siteLocale === 'sw' || siteLocale === 'rn';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-primary">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              {tPage('metaTitle')}
            </h1>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Language notice for sw/rn site locales */}
          {needsNotice && (
            <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">{tLegal('languageNoticeTitle')}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">{tLegal('languageNoticeDescription')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDocLang('fr')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${docLang === 'fr' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'}`}
                    >
                      {tLegal('viewInFrench')}
                    </button>
                    <button
                      onClick={() => setDocLang('en')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${docLang === 'en' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'}`}
                    >
                      {tLegal('viewInEnglish')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="mb-8 p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/30">
            <p className="text-sm text-primary">
              <strong>{c.lastUpdated}</strong>
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              {c.intro.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">{c.intro.p1}</p>
              <p className="text-muted-foreground leading-relaxed mb-4">{c.intro.p2}</p>
              <p className="text-muted-foreground leading-relaxed">{c.intro.p3}</p>
            </div>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Users className="w-8 h-8 mr-3 text-green-600" />
              {c.definitions.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{c.definitions.owner}</h3>
                  <p className="text-muted-foreground text-sm">{c.definitions.ownerDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{c.definitions.renter}</h3>
                  <p className="text-muted-foreground text-sm">{c.definitions.renterDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{c.definitions.vehicle}</h3>
                  <p className="text-muted-foreground text-sm">{c.definitions.vehicleDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{c.definitions.booking}</h3>
                  <p className="text-muted-foreground text-sm">{c.definitions.bookingDesc}</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Shield className="w-8 h-8 mr-3 text-purple-600" />
              {c.accounts.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.accounts.sub1Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.accounts.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.accounts.sub2Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {c.accounts.sub2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>

          {/* Vehicle Rentals */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Car className="w-8 h-8 mr-3 text-blue-600" />
              {c.rentals.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.rentals.sub1Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.rentals.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.rentals.sub2Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.rentals.sub2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.rentals.sub3Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {c.rentals.sub3Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>

          {/* Payments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-green-600" />
              {c.payments.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.payments.sub1Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.payments.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.payments.sub2Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.payments.sub2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.payments.sub3Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {c.payments.sub3Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>

          {/* Responsibilities */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <AlertTriangle className="w-8 h-8 mr-3 text-red-600" />
              {c.responsibilities.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.responsibilities.sub1Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.responsibilities.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.responsibilities.sub2Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.responsibilities.sub2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.responsibilities.sub3Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {c.responsibilities.sub3Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {c.cancellation.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-foreground font-semibold">{c.cancellation.headerDelay}</th>
                      <th className="py-3 text-foreground font-semibold">{c.cancellation.headerRefund}</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {c.cancellation.rows.map((row, i) => (
                      <tr key={i} className={i < c.cancellation.rows.length - 1 ? "border-b border-border" : ""}>
                        <td className="py-3">{row[0]}</td>
                        <td className="py-3">{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {c.prohibited.title}
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 shadow-lg border border-red-200 dark:border-red-800">
              <div className="grid md:grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
                <div>
                  <h3 className="font-semibold mb-2">{c.prohibited.strictlyTitle}</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {c.prohibited.strictlyItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{c.prohibited.sanctionsTitle}</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {c.prohibited.sanctionsItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {c.contact.title}
            </h2>
            <div className="bg-primary rounded-2xl p-8 text-white shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    {c.contact.phoneTitle}
                  </h3>
                  <p className="mb-2">+257 XX XX XX XX</p>
                  <p className="text-white/80 text-sm">{c.contact.phoneHours}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    {c.contact.emailTitle}
                  </h3>
                  <p className="mb-2">contact@budaxdrive.bi</p>
                  <p className="text-white/80 text-sm">{c.contact.emailResponse}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final Terms */}
          <section className="mb-12">
            <div className="bg-muted rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                {c.final.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{c.final.p1}</p>
              <p className="text-muted-foreground leading-relaxed">{c.final.p2}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
