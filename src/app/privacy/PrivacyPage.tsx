'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Shield, Eye, Database, Lock, Users, Cookie, FileText, Mail, Clock, AlertCircle, Globe } from 'lucide-react';

type DocLang = 'fr' | 'en';

const content: Record<DocLang, {
  lastUpdated: string;
  intro: { title: string; p1: string; p2: string; p3: string };
  collection: { title: string; sub1Title: string; sub1Items: string[]; sub2Title: string; sub2Items: string[]; sub3Title: string; sub3Items: string[] };
  usage: { title: string; coreTitle: string; coreItems: string[]; improveTitle: string; improveItems: string[] };
  sharing: { title: string; sub1Title: string; sub1Desc: string; sub1Items: string[]; sub2Title: string; partnersTitle: string; partnersItems: string[]; authoritiesTitle: string; authoritiesItems: string[] };
  security: { title: string; encryptionTitle: string; encryptionDesc: string; accessTitle: string; accessDesc: string; backupTitle: string; backupDesc: string; extraTitle: string; extraItems: string[] };
  cookies: { title: string; intro: string; headerType: string; headerPurpose: string; headerDuration: string; rows: [string, string, string][] };
  rights: { title: string; accessTitle: string; rightAccessBadge: string; rightAccessLabel: string; rightEditBadge: string; rightEditLabel: string; rightDeleteBadge: string; rightDeleteLabel: string; rightPortBadge: string; rightPortLabel: string; howTitle: string; byEmailTitle: string; fromAccountTitle: string; fromAccountDesc: string; responseTimeTitle: string; responseTimeDesc: string };
  retention: { title: string; activeTitle: string; activeDesc: string; activeValue: string; deletedTitle: string; deletedDesc: string; deletedValue: string; legalTitle: string; legalDesc: string; legalValue: string; anonTitle: string; anonDesc: string; anonValue: string };
  contact: { title: string; questionsTitle: string; responseGuarantee: string; emergencyTitle: string; emergencyHours: string; breachNotice: string };
  updates: { title: string; p1: string; p2: string; versionLabel: string };
}> = {
  fr: {
    lastUpdated: "Dernière mise à jour : 24 août 2026",
    intro: {
      title: "1. Introduction",
      p1: "CarShare Burundi s'engage à protéger votre vie privée et vos données personnelles. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles.",
      p2: "En utilisant nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité. Nous nous conformons aux lois burundaises et internationales sur la protection des données.",
      p3: "Cette politique s'applique à tous nos services : site web, application mobile et services associés."
    },
    collection: {
      title: "2. Données Collectées",
      sub1Title: "2.1 Informations personnelles",
      sub1Items: ["Nom et prénom", "Adresse email et numéro de téléphone", "Pièce d'identité, permis de conduire et selfie (vérification de compte)", "Photo de profil"],
      sub2Title: "2.2 Données d'utilisation",
      sub2Items: ["Historique des réservations", "Évaluations et commentaires", "Messages échangés sur la messagerie intégrée", "Localisation des véhicules (renseignée par les propriétaires, affichée sur la carte)"],
      sub3Title: "2.3 Données techniques",
      sub3Items: ["Informations techniques sur votre connexion", "Type d'appareil et navigateur", "Cookie de préférence de langue", "Historique technique de connexion (en cas de problème)"]
    },
    usage: {
      title: "3. Utilisation des Données",
      coreTitle: "Services principaux",
      coreItems: ["Création et gestion de comptes", "Mise en relation propriétaires/locataires", "Traitement des réservations", "Support client", "Vérification d'identité"],
      improveTitle: "Amélioration",
      improveItems: ["Développement de nouvelles fonctionnalités", "Prévention des abus (ex. limites sur les tentatives de réservation)", "Sécurisation de la plateforme"]
    },
    sharing: {
      title: "4. Partage des Données",
      sub1Title: "4.1 Avec d'autres utilisateurs",
      sub1Desc: "Nous partageons certaines informations entre propriétaires et locataires pour faciliter les transactions :",
      sub1Items: ["Nom, photo de profil et évaluations", "Coordonnées personnelles (téléphone, email) : jamais partagées directement — les échanges passent par la messagerie intégrée ou par BudaxDrive", "Historique de location (nombre de voyages)"],
      sub2Title: "4.2 Avec des tiers",
      partnersTitle: "Partenaires autorisés",
      partnersItems: ["Stripe (traitement des paiements par carte)", "Cloudinary (hébergement des photos)", "OpenStreetMap (cartes et localisation)"],
      authoritiesTitle: "Autorités légales",
      authoritiesItems: ["Demandes judiciaires", "Enquêtes policières", "Obligations légales", "Protection des droits"]
    },
    security: {
      title: "5. Sécurité des Données",
      encryptionTitle: "Mots de passe", encryptionDesc: "Protégés par un système de sécurité avancé, jamais stockés ni consultables en clair",
      accessTitle: "Documents sensibles", accessDesc: "Identité, permis et selfie stockés sur un espace protégé, accessible uniquement par vous et les administrateurs autorisés",
      backupTitle: "Paiements", backupDesc: "Aucune donnée de carte bancaire n'est conservée chez nous — les paiements sont traités par Stripe ou votre opérateur Mobile Money",
      extraTitle: "Mesures en place",
      extraItems: ["Connexions sécurisées et protégées", "Accès aux documents restreint par rôle (propriétaire, administrateur)", "Améliorations de sécurité continues"]
    },
    cookies: {
      title: "6. Cookies et Technologies Similaires",
      intro: "Nous utilisons uniquement un cookie technique, nécessaire au fonctionnement du site : mémoriser la langue que vous avez choisie. Nous n'utilisons aucun cookie publicitaire ni de suivi analytique.",
      headerType: "Type de Cookie", headerPurpose: "Objectif", headerDuration: "Durée",
      rows: [["Préférence de langue", "Mémoriser la langue choisie", "Persistant"]]
    },
    rights: {
      title: "7. Vos Droits",
      accessTitle: "Droits d'accès et de contrôle",
      rightAccessBadge: "ACCÈS", rightAccessLabel: "Consulter vos données personnelles",
      rightEditBadge: "MODIF", rightEditLabel: "Corriger ou mettre à jour vos informations",
      rightDeleteBadge: "SUPPR", rightDeleteLabel: "Demander la suppression de vos données",
      rightPortBadge: "PORT", rightPortLabel: "Récupérer vos données dans un format portable",
      howTitle: "Comment exercer vos droits",
      byEmailTitle: "Par email",
      fromAccountTitle: "Depuis votre compte", fromAccountDesc: "Téléchargez vos données ou supprimez votre compte directement depuis votre profil",
      responseTimeTitle: "Délai de réponse", responseTimeDesc: "Maximum 30 jours"
    },
    retention: {
      title: "8. Conservation des Données",
      activeTitle: "Données de compte actif", activeDesc: "Tant que votre compte est actif", activeValue: "Illimitée",
      deletedTitle: "Après suppression du compte", deletedDesc: "Vos documents d'identité sont supprimés immédiatement ; le reste de vos données personnelles est effacé ou anonymisé", deletedValue: "5 ans",
      legalTitle: "Données de transaction", legalDesc: "Conservées pour nos obligations comptables et légales", legalValue: "10 ans",
      anonTitle: "Données anonymisées", anonDesc: "Statistiques internes", anonValue: "Permanent"
    },
    contact: {
      title: "9. Contact - Protection des Données",
      questionsTitle: "Questions sur vos données", responseGuarantee: "Nous répondons dans les meilleurs délais",
      emergencyTitle: "Délai de réponse", emergencyHours: "Délai de traitement de votre demande",
      breachNotice: "Important : En cas de violation de données, nous nous engageons à vous notifier dans les 72 heures suivant la découverte de l'incident."
    },
    updates: {
      title: "Mises à jour de cette Politique",
      p1: "Cette politique peut être mise à jour périodiquement pour refléter les changements dans nos pratiques ou pour des raisons légales et réglementaires.",
      p2: "Nous vous informerons de tout changement significatif par email et via une notification sur la plateforme au moins 30 jours avant l'entrée en vigueur.",
      versionLabel: "Version actuelle : 3.0 - Août 2026"
    }
  },
  en: {
    lastUpdated: "Last updated: August 24, 2026",
    intro: {
      title: "1. Introduction",
      p1: "CarShare Burundi is committed to protecting your privacy and personal data. This policy explains how we collect, use, store and protect your personal information.",
      p2: "By using our services, you agree to the practices described in this privacy policy. We comply with Burundian and international data protection laws.",
      p3: "This policy applies to all our services: website, mobile app and related services."
    },
    collection: {
      title: "2. Data Collected",
      sub1Title: "2.1 Personal information",
      sub1Items: ["First and last name", "Email address and phone number", "ID document, driving license and selfie (account verification)", "Profile photo"],
      sub2Title: "2.2 Usage data",
      sub2Items: ["Booking history", "Ratings and reviews", "Messages sent through the built-in chat", "Vehicle locations (set by owners, shown on the map)"],
      sub3Title: "2.3 Technical data",
      sub3Items: ["Technical information about your connection", "Device and browser type", "Language preference cookie", "Technical connection history (in case of an issue)"]
    },
    usage: {
      title: "3. Use of Data",
      coreTitle: "Core services",
      coreItems: ["Account creation and management", "Connecting owners/renters", "Booking processing", "Customer support", "Identity verification"],
      improveTitle: "Improvement",
      improveItems: ["Development of new features", "Abuse prevention (e.g. limits on booking attempts)", "Platform security"]
    },
    sharing: {
      title: "4. Data Sharing",
      sub1Title: "4.1 With other users",
      sub1Desc: "We share certain information between owners and renters to facilitate transactions:",
      sub1Items: ["Name, profile photo and ratings", "Personal contact details (phone, email): never shared directly — all communication goes through the built-in chat or via BudaxDrive", "Rental history (number of trips)"],
      sub2Title: "4.2 With third parties",
      partnersTitle: "Authorized partners",
      partnersItems: ["Stripe (card payment processing)", "Cloudinary (photo hosting)", "OpenStreetMap (maps and location)"],
      authoritiesTitle: "Legal authorities",
      authoritiesItems: ["Judicial requests", "Police investigations", "Legal obligations", "Protection of rights"]
    },
    security: {
      title: "5. Data Security",
      encryptionTitle: "Passwords", encryptionDesc: "Protected by advanced security, never stored or readable in plain text",
      accessTitle: "Sensitive documents", accessDesc: "ID, license and selfie stored in a protected space, accessible only by you and authorized administrators",
      backupTitle: "Payments", backupDesc: "We never keep your card details — payments are processed by Stripe or your Mobile Money operator",
      extraTitle: "Measures in place",
      extraItems: ["Secure, protected connections", "Document access restricted by role (owner, administrator)", "Ongoing security improvements"]
    },
    cookies: {
      title: "6. Cookies and Similar Technologies",
      intro: "We only use one technical cookie, needed for the site to work: remembering the language you chose. We do not use any advertising or analytics/tracking cookies.",
      headerType: "Cookie Type", headerPurpose: "Purpose", headerDuration: "Duration",
      rows: [["Language preference", "Remember your chosen language", "Persistent"]]
    },
    rights: {
      title: "7. Your Rights",
      accessTitle: "Access and control rights",
      rightAccessBadge: "ACCESS", rightAccessLabel: "View your personal data",
      rightEditBadge: "EDIT", rightEditLabel: "Correct or update your information",
      rightDeleteBadge: "DELETE", rightDeleteLabel: "Request deletion of your data",
      rightPortBadge: "EXPORT", rightPortLabel: "Retrieve your data in a portable format",
      howTitle: "How to exercise your rights",
      byEmailTitle: "By email",
      fromAccountTitle: "From your account", fromAccountDesc: "Download your data or delete your account directly from your profile",
      responseTimeTitle: "Response time", responseTimeDesc: "Maximum 30 days"
    },
    retention: {
      title: "8. Data Retention",
      activeTitle: "Active account data", activeDesc: "As long as your account is active", activeValue: "Unlimited",
      deletedTitle: "After account deletion", deletedDesc: "Your identity documents are deleted immediately; the rest of your personal data is erased or anonymized", deletedValue: "5 years",
      legalTitle: "Transaction data", legalDesc: "Kept for our accounting and legal obligations", legalValue: "10 years",
      anonTitle: "Anonymized data", anonDesc: "Internal statistics", anonValue: "Permanent"
    },
    contact: {
      title: "9. Contact - Data Protection",
      questionsTitle: "Questions about your data", responseGuarantee: "We respond as soon as we can",
      emergencyTitle: "Response time", emergencyHours: "Time to process your request",
      breachNotice: "Important: In the event of a data breach, we are committed to notifying you within 72 hours of discovering the incident."
    },
    updates: {
      title: "Updates to this Policy",
      p1: "This policy may be updated periodically to reflect changes in our practices or for legal and regulatory reasons.",
      p2: "We will inform you of any significant change by email and via a notification on the platform at least 30 days before it takes effect.",
      versionLabel: "Current version: 3.0 - August 2026"
    }
  }
};

const PrivacyPage = () => {
  const siteLocale = useLocale();
  const tLegal = useTranslations('legal');
  const tPage = useTranslations('privacy');
  const [docLang, setDocLang] = useState<DocLang>(siteLocale === 'en' ? 'en' : 'fr');
  const c = content[docLang];
  const needsNotice = siteLocale === 'sw' || siteLocale === 'rn';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-green-800 dark:from-green-800 dark:via-teal-800 dark:to-green-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              {tPage('metaTitle')}
            </h1>
          </div>
        </div>
      </div>

      {/* Privacy Content */}
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
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>{c.lastUpdated}</strong>
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Shield className="w-8 h-8 mr-3 text-green-600" />
              {c.intro.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">{c.intro.p1}</p>
              <p className="text-muted-foreground leading-relaxed mb-4">{c.intro.p2}</p>
              <p className="text-muted-foreground leading-relaxed">{c.intro.p3}</p>
            </div>
          </section>

          {/* Data Collection */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Database className="w-8 h-8 mr-3 text-blue-600" />
              {c.collection.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.collection.sub1Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.collection.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.collection.sub2Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.collection.sub2Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.collection.sub3Title}</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {c.collection.sub3Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </section>

          {/* Data Usage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Eye className="w-8 h-8 mr-3 text-purple-600" />
              {c.usage.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">{c.usage.coreTitle}</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    {c.usage.coreItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">{c.usage.improveTitle}</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    {c.usage.improveItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Users className="w-8 h-8 mr-3 text-orange-600" />
              {c.sharing.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.sharing.sub1Title}</h3>
              <p className="text-muted-foreground mb-4">{c.sharing.sub1Desc}</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                {c.sharing.sub1Items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">{c.sharing.sub2Title}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-foreground">{c.sharing.partnersTitle}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {c.sharing.partnersItems.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-foreground">{c.sharing.authoritiesTitle}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {c.sharing.authoritiesItems.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Lock className="w-8 h-8 mr-3 text-red-600" />
              {c.security.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-red-100 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{c.security.encryptionTitle}</h3>
                  <p className="text-sm text-muted-foreground">{c.security.encryptionDesc}</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{c.security.accessTitle}</h3>
                  <p className="text-sm text-muted-foreground">{c.security.accessDesc}</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{c.security.backupTitle}</h3>
                  <p className="text-sm text-muted-foreground">{c.security.backupDesc}</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">{c.security.extraTitle}</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {c.security.extraItems.map((item, i) => <li key={i}>• {item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Cookie className="w-8 h-8 mr-3 text-amber-600" />
              {c.cookies.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-6">{c.cookies.intro}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-foreground font-semibold">{c.cookies.headerType}</th>
                      <th className="py-3 text-foreground font-semibold">{c.cookies.headerPurpose}</th>
                      <th className="py-3 text-foreground font-semibold">{c.cookies.headerDuration}</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {c.cookies.rows.map((row, i) => (
                      <tr key={i} className={i < c.cookies.rows.length - 1 ? "border-b border-border" : ""}>
                        <td className="py-3">{row[0]}</td>
                        <td className="py-3">{row[1]}</td>
                        <td className="py-3">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <FileText className="w-8 h-8 mr-3 text-indigo-600" />
              {c.rights.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-foreground">{c.rights.accessTitle}</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">{c.rights.rightAccessBadge}</span>
                      <span className="text-muted-foreground text-sm">{c.rights.rightAccessLabel}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">{c.rights.rightEditBadge}</span>
                      <span className="text-muted-foreground text-sm">{c.rights.rightEditLabel}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/20 text-red-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">{c.rights.rightDeleteBadge}</span>
                      <span className="text-muted-foreground text-sm">{c.rights.rightDeleteLabel}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">{c.rights.rightPortBadge}</span>
                      <span className="text-muted-foreground text-sm">{c.rights.rightPortLabel}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-foreground">{c.rights.howTitle}</h3>
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">{c.rights.byEmailTitle}</h4>
                      <p className="text-xs text-muted-foreground">contact@budaxdrive.bi</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">{c.rights.fromAccountTitle}</h4>
                      <p className="text-xs text-muted-foreground">{c.rights.fromAccountDesc}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">{c.rights.responseTimeTitle}</h4>
                      <p className="text-xs text-muted-foreground">{c.rights.responseTimeDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {c.retention.title}
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{c.retention.activeTitle}</h3>
                    <p className="text-sm text-muted-foreground">{c.retention.activeDesc}</p>
                  </div>
                  <span className="text-green-600 font-medium">{c.retention.activeValue}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{c.retention.deletedTitle}</h3>
                    <p className="text-sm text-muted-foreground">{c.retention.deletedDesc}</p>
                  </div>
                  <span className="text-blue-600 font-medium">{c.retention.deletedValue}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{c.retention.legalTitle}</h3>
                    <p className="text-sm text-muted-foreground">{c.retention.legalDesc}</p>
                  </div>
                  <span className="text-orange-600 font-medium">{c.retention.legalValue}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{c.retention.anonTitle}</h3>
                    <p className="text-sm text-muted-foreground">{c.retention.anonDesc}</p>
                  </div>
                  <span className="text-purple-600 font-medium">{c.retention.anonValue}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {c.contact.title}
            </h2>
            <div className="bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-800 rounded-2xl p-8 text-white shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    {c.contact.questionsTitle}
                  </h3>
                  <p className="mb-2">contact@budaxdrive.bi</p>
                  <p className="text-green-100 text-sm">{c.contact.responseGuarantee}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    {c.contact.emergencyTitle}
                  </h3>
                  <p className="mb-2">30 {docLang === 'fr' ? 'jours maximum' : 'days maximum'}</p>
                  <p className="text-green-100 text-sm">{c.contact.emergencyHours}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-700 dark:bg-green-900 rounded-lg">
                <p className="text-sm">
                  <strong>{c.contact.breachNotice}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section className="mb-12">
            <div className="bg-muted rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                {c.updates.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{c.updates.p1}</p>
              <p className="text-muted-foreground leading-relaxed mb-4">{c.updates.p2}</p>
              <p className="text-muted-foreground text-sm">{c.updates.versionLabel}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
