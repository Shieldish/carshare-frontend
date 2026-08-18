'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Shield, Eye, Database, Lock, Users, Cookie, FileText, Mail, Phone, AlertCircle, Globe } from 'lucide-react';

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
  updates: { title: string; p1: string; p2: string; versionLabel: string; historyLink: string };
}> = {
  fr: {
    lastUpdated: "Dernière mise à jour : 15 septembre 2025",
    intro: {
      title: "1. Introduction",
      p1: "CarShare Burundi s'engage à protéger votre vie privée et vos données personnelles. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles.",
      p2: "En utilisant nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité. Nous nous conformons aux lois burundaises et internationales sur la protection des données.",
      p3: "Cette politique s'applique à tous nos services : site web, application mobile et services associés."
    },
    collection: {
      title: "2. Données Collectées",
      sub1Title: "2.1 Informations personnelles",
      sub1Items: ["Nom, prénom, date de naissance", "Adresse email et numéro de téléphone", "Adresse postale", "Informations du permis de conduire", "Données bancaires (cryptées)", "Photos de profil et documents d'identité"],
      sub2Title: "2.2 Données d'utilisation",
      sub2Items: ["Historique des réservations", "Préférences de véhicules", "Évaluations et commentaires", "Communications sur la plateforme", "Données de géolocalisation (avec consentement)"],
      sub3Title: "2.3 Données techniques",
      sub3Items: ["Adresse IP et données de connexion", "Type d'appareil et navigateur", "Données de navigation (cookies)", "Logs de sécurité"]
    },
    usage: {
      title: "3. Utilisation des Données",
      coreTitle: "Services principaux",
      coreItems: ["Création et gestion de comptes", "Mise en relation propriétaires/locataires", "Traitement des réservations", "Support client personnalisé", "Vérification d'identité"],
      improveTitle: "Amélioration",
      improveItems: ["Analyses et statistiques", "Développement de nouvelles fonctionnalités", "Prévention de la fraude", "Sécurisation de la plateforme", "Personnalisation de l'expérience"]
    },
    sharing: {
      title: "4. Partage des Données",
      sub1Title: "4.1 Avec d'autres utilisateurs",
      sub1Desc: "Nous partageons certaines informations entre propriétaires et locataires pour faciliter les transactions :",
      sub1Items: ["Nom, photo de profil et évaluations", "Informations de contact (masquées jusqu'à confirmation)", "Historique de location (nombre de voyages)"],
      sub2Title: "4.2 Avec des tiers",
      partnersTitle: "Partenaires autorisés",
      partnersItems: ["Processeurs de paiement", "Compagnies d'assurance", "Services de vérification d'identité", "Prestataires techniques"],
      authoritiesTitle: "Autorités légales",
      authoritiesItems: ["Demandes judiciaires", "Enquêtes policières", "Obligations légales", "Protection des droits"]
    },
    security: {
      title: "5. Sécurité des Données",
      encryptionTitle: "Chiffrement", encryptionDesc: "Données sensibles chiffrées avec AES-256",
      accessTitle: "Accès Contrôlé", accessDesc: "Authentification multi-facteurs obligatoire",
      backupTitle: "Sauvegarde", backupDesc: "Sauvegardes quotidiennes automatisées",
      extraTitle: "Mesures supplémentaires",
      extraItems: ["Monitoring 24h/7j des accès", "Tests de pénétration réguliers", "Formation sécurité des employés", "Mise à jour continue des systèmes"]
    },
    cookies: {
      title: "6. Cookies et Technologies Similaires",
      intro: "Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation de nos services.",
      headerType: "Type de Cookie", headerPurpose: "Objectif", headerDuration: "Durée",
      rows: [["Essentiels", "Fonctionnement du site", "Session"], ["Préférences", "Mémoriser vos choix", "1 an"], ["Analytiques", "Statistiques d'usage", "2 ans"], ["Publicitaires", "Annonces personnalisées", "13 mois"]]
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
      fromAccountTitle: "Depuis votre compte", fromAccountDesc: "Section \"Paramètres de confidentialité\"",
      responseTimeTitle: "Délai de réponse", responseTimeDesc: "Maximum 30 jours"
    },
    retention: {
      title: "8. Conservation des Données",
      activeTitle: "Données de compte actif", activeDesc: "Tant que votre compte est actif", activeValue: "Illimitée",
      deletedTitle: "Après suppression du compte", deletedDesc: "Données personnelles supprimées", deletedValue: "30 jours",
      legalTitle: "Données légales", legalDesc: "Transactions, factures", legalValue: "7 ans",
      anonTitle: "Données anonymisées", anonDesc: "Statistiques, analyses", anonValue: "Permanent"
    },
    contact: {
      title: "9. Contact - Délégué à la Protection des Données",
      questionsTitle: "Questions sur vos données", responseGuarantee: "Réponse sous 48h garantie",
      emergencyTitle: "Urgence Confidentialité", emergencyHours: "7j/7 - 24h/24",
      breachNotice: "Important : En cas de violation de données, nous nous engageons à vous notifier dans les 72 heures suivant la découverte de l'incident."
    },
    updates: {
      title: "Mises à jour de cette Politique",
      p1: "Cette politique peut être mise à jour périodiquement pour refléter les changements dans nos pratiques ou pour des raisons légales et réglementaires.",
      p2: "Nous vous informerons de tout changement significatif par email et via une notification sur la plateforme au moins 30 jours avant l'entrée en vigueur.",
      versionLabel: "Version actuelle : 2.1 - Septembre 2025",
      historyLink: "Voir l'historique des versions →"
    }
  },
  en: {
    lastUpdated: "Last updated: September 15, 2025",
    intro: {
      title: "1. Introduction",
      p1: "CarShare Burundi is committed to protecting your privacy and personal data. This policy explains how we collect, use, store and protect your personal information.",
      p2: "By using our services, you agree to the practices described in this privacy policy. We comply with Burundian and international data protection laws.",
      p3: "This policy applies to all our services: website, mobile app and related services."
    },
    collection: {
      title: "2. Data Collected",
      sub1Title: "2.1 Personal information",
      sub1Items: ["First name, last name, date of birth", "Email address and phone number", "Postal address", "Driving license information", "Bank data (encrypted)", "Profile photos and ID documents"],
      sub2Title: "2.2 Usage data",
      sub2Items: ["Booking history", "Vehicle preferences", "Ratings and reviews", "Communications on the platform", "Geolocation data (with consent)"],
      sub3Title: "2.3 Technical data",
      sub3Items: ["IP address and connection data", "Device and browser type", "Browsing data (cookies)", "Security logs"]
    },
    usage: {
      title: "3. Use of Data",
      coreTitle: "Core services",
      coreItems: ["Account creation and management", "Connecting owners/renters", "Booking processing", "Personalized customer support", "Identity verification"],
      improveTitle: "Improvement",
      improveItems: ["Analytics and statistics", "Development of new features", "Fraud prevention", "Platform security", "Personalizing your experience"]
    },
    sharing: {
      title: "4. Data Sharing",
      sub1Title: "4.1 With other users",
      sub1Desc: "We share certain information between owners and renters to facilitate transactions:",
      sub1Items: ["Name, profile photo and ratings", "Contact information (hidden until confirmation)", "Rental history (number of trips)"],
      sub2Title: "4.2 With third parties",
      partnersTitle: "Authorized partners",
      partnersItems: ["Payment processors", "Insurance companies", "Identity verification services", "Technical service providers"],
      authoritiesTitle: "Legal authorities",
      authoritiesItems: ["Judicial requests", "Police investigations", "Legal obligations", "Protection of rights"]
    },
    security: {
      title: "5. Data Security",
      encryptionTitle: "Encryption", encryptionDesc: "Sensitive data encrypted with AES-256",
      accessTitle: "Controlled Access", accessDesc: "Mandatory multi-factor authentication",
      backupTitle: "Backup", backupDesc: "Automated daily backups",
      extraTitle: "Additional measures",
      extraItems: ["24/7 access monitoring", "Regular penetration testing", "Employee security training", "Continuous system updates"]
    },
    cookies: {
      title: "6. Cookies and Similar Technologies",
      intro: "We use cookies to improve your experience and analyze the use of our services.",
      headerType: "Cookie Type", headerPurpose: "Purpose", headerDuration: "Duration",
      rows: [["Essential", "Site functionality", "Session"], ["Preferences", "Remember your choices", "1 year"], ["Analytics", "Usage statistics", "2 years"], ["Advertising", "Personalized ads", "13 months"]]
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
      fromAccountTitle: "From your account", fromAccountDesc: "\"Privacy settings\" section",
      responseTimeTitle: "Response time", responseTimeDesc: "Maximum 30 days"
    },
    retention: {
      title: "8. Data Retention",
      activeTitle: "Active account data", activeDesc: "As long as your account is active", activeValue: "Unlimited",
      deletedTitle: "After account deletion", deletedDesc: "Personal data deleted", deletedValue: "30 days",
      legalTitle: "Legal data", legalDesc: "Transactions, invoices", legalValue: "7 years",
      anonTitle: "Anonymized data", anonDesc: "Statistics, analytics", anonValue: "Permanent"
    },
    contact: {
      title: "9. Contact - Data Protection Officer",
      questionsTitle: "Questions about your data", responseGuarantee: "48h response guaranteed",
      emergencyTitle: "Privacy Emergency", emergencyHours: "7 days a week - 24 hours a day",
      breachNotice: "Important: In the event of a data breach, we are committed to notifying you within 72 hours of discovering the incident."
    },
    updates: {
      title: "Updates to this Policy",
      p1: "This policy may be updated periodically to reflect changes in our practices or for legal and regulatory reasons.",
      p2: "We will inform you of any significant change by email and via a notification on the platform at least 30 days before it takes effect.",
      versionLabel: "Current version: 2.1 - September 2025",
      historyLink: "View version history →"
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
                      <p className="text-xs text-muted-foreground">orl.ndonse@gmail.com</p>
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
                  <p className="mb-2">orl.ndonse@gmail.com</p>
                  <p className="text-green-100 text-sm">{c.contact.responseGuarantee}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    {c.contact.emergencyTitle}
                  </h3>
                  <p className="mb-2">+257 XX XX XX XX</p>
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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-muted-foreground text-sm">{c.updates.versionLabel}</p>
                <a
                  href="#"
                  className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
                >
                  {c.updates.historyLink}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
