'use client';

import React from 'react';
import { Shield, Eye, Database, Lock, Users, Cookie, FileText, Mail, Phone, AlertCircle } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-green-800 dark:from-green-800 dark:via-teal-800 dark:to-green-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
              Votre vie privée est importante pour nous. Découvrez comment nous protégeons vos données personnelles.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Dernière mise à jour :</strong> 15 septembre 2025
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Shield className="w-8 h-8 mr-3 text-green-600" />
              1. Introduction
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">
                CarShare Burundi s'engage à protéger votre vie privée et vos données personnelles. Cette politique 
                explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En utilisant nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité. 
                Nous nous conformons aux lois burundaises et internationales sur la protection des données.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cette politique s'applique à tous nos services : site web, application mobile et services associés.
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Database className="w-8 h-8 mr-3 text-blue-600" />
              2. Données Collectées
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">2.1 Informations personnelles</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Nom, prénom, date de naissance</li>
                <li>Adresse email et numéro de téléphone</li>
                <li>Adresse postale</li>
                <li>Informations du permis de conduire</li>
                <li>Données bancaires (cryptées)</li>
                <li>Photos de profil et documents d'identité</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">2.2 Données d'utilisation</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Historique des réservations</li>
                <li>Préférences de véhicules</li>
                <li>Évaluations et commentaires</li>
                <li>Communications sur la plateforme</li>
                <li>Données de géolocalisation (avec consentement)</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">2.3 Données techniques</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Adresse IP et données de connexion</li>
                <li>Type d'appareil et navigateur</li>
                <li>Données de navigation (cookies)</li>
                <li>Logs de sécurité</li>
              </ul>
            </div>
          </section>

          {/* Data Usage */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Eye className="w-8 h-8 mr-3 text-purple-600" />
              3. Utilisation des Données
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Services principaux</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    <li>Création et gestion de comptes</li>
                    <li>Mise en relation propriétaires/locataires</li>
                    <li>Traitement des réservations</li>
                    <li>Support client personnalisé</li>
                    <li>Vérification d'identité</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Amélioration</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                    <li>Analyses et statistiques</li>
                    <li>Développement de nouvelles fonctionnalités</li>
                    <li>Prévention de la fraude</li>
                    <li>Sécurisation de la plateforme</li>
                    <li>Personnalisation de l'expérience</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Users className="w-8 h-8 mr-3 text-orange-600" />
              4. Partage des Données
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">4.1 Avec d'autres utilisateurs</h3>
              <p className="text-muted-foreground mb-4">
                Nous partageons certaines informations entre propriétaires et locataires pour faciliter les transactions :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Nom, photo de profil et évaluations</li>
                <li>Informations de contact (masquées jusqu'à confirmation)</li>
                <li>Historique de location (nombre de voyages)</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">4.2 Avec des tiers</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-foreground">Partenaires autorisés</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Processeurs de paiement</li>
                    <li>• Compagnies d'assurance</li>
                    <li>• Services de vérification d'identité</li>
                    <li>• Prestataires techniques</li>
                  </ul>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-foreground">Autorités légales</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Demandes judiciaires</li>
                    <li>• Enquêtes policières</li>
                    <li>• Obligations légales</li>
                    <li>• Protection des droits</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Lock className="w-8 h-8 mr-3 text-red-600" />
              5. Sécurité des Données
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-red-100 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Chiffrement</h3>
                  <p className="text-sm text-muted-foreground">
                    Données sensibles chiffrées avec AES-256
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Accès Contrôlé</h3>
                  <p className="text-sm text-muted-foreground">
                    Authentification multi-facteurs obligatoire
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Sauvegarde</h3>
                  <p className="text-sm text-muted-foreground">
                    Sauvegardes quotidiennes automatisées
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Mesures supplémentaires</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Monitoring 24h/7j des accès</li>
                      <li>• Tests de pénétration réguliers</li>
                      <li>• Formation sécurité des employés</li>
                      <li>• Mise à jour continue des systèmes</li>
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
              6. Cookies et Technologies Similaires
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation de nos services.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-foreground font-semibold">Type de Cookie</th>
                      <th className="py-3 text-foreground font-semibold">Objectif</th>
                      <th className="py-3 text-foreground font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-3">Essentiels</td>
                      <td className="py-3">Fonctionnement du site</td>
                      <td className="py-3">Session</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3">Préférences</td>
                      <td className="py-3">Mémoriser vos choix</td>
                      <td className="py-3">1 an</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3">Analytiques</td>
                      <td className="py-3">Statistiques d'usage</td>
                      <td className="py-3">2 ans</td>
                    </tr>
                    <tr>
                      <td className="py-3">Publicitaires</td>
                      <td className="py-3">Annonces personnalisées</td>
                      <td className="py-3">13 mois</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <FileText className="w-8 h-8 mr-3 text-indigo-600" />
              7. Vos Droits
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Droits d'accès et de contrôle</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">ACCÈS</span>
                      <span className="text-muted-foreground text-sm">Consulter vos données personnelles</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">MODIF</span>
                      <span className="text-muted-foreground text-sm">Corriger ou mettre à jour vos informations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 dark:bg-red-900/20 text-red-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">SUPPR</span>
                      <span className="text-muted-foreground text-sm">Demander la suppression de vos données</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">PORT</span>
                      <span className="text-muted-foreground text-sm">Récupérer vos données dans un format portable</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Comment exercer vos droits</h3>
                  <div className="space-y-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">Par email</h4>
                      <p className="text-xs text-muted-foreground">orl.ndonse@gmail.com</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">Depuis votre compte</h4>
                      <p className="text-xs text-muted-foreground">Section "Paramètres de confidentialité"</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1 text-foreground">Délai de réponse</h4>
                      <p className="text-xs text-muted-foreground">Maximum 30 jours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              8. Conservation des Données
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Données de compte actif</h3>
                    <p className="text-sm text-muted-foreground">Tant que votre compte est actif</p>
                  </div>
                  <span className="text-green-600 font-medium">Illimitée</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Après suppression du compte</h3>
                    <p className="text-sm text-muted-foreground">Données personnelles supprimées</p>
                  </div>
                  <span className="text-blue-600 font-medium">30 jours</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Données légales</h3>
                    <p className="text-sm text-muted-foreground">Transactions, factures</p>
                  </div>
                  <span className="text-orange-600 font-medium">7 ans</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">Données anonymisées</h3>
                    <p className="text-sm text-muted-foreground">Statistiques, analyses</p>
                  </div>
                  <span className="text-purple-600 font-medium">Permanent</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              9. Contact - Délégué à la Protection des Données
            </h2>
            <div className="bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-800 rounded-2xl p-8 text-white shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Questions sur vos données
                  </h3>
                  <p className="mb-2">orl.ndonse@gmail.com</p>
                  <p className="text-green-100 text-sm">Réponse sous 48h garantie</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Urgence Confidentialité
                  </h3>
                  <p className="mb-2">+257 XX XX XX XX</p>
                  <p className="text-green-100 text-sm">7j/7 - 24h/24</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-700 dark:bg-green-900 rounded-lg">
                <p className="text-sm">
                  <strong>Important :</strong> En cas de violation de données, nous nous engageons à vous notifier 
                  dans les 72 heures suivant la découverte de l'incident.
                </p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section className="mb-12">
            <div className="bg-muted rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                Mises à jour de cette Politique
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cette politique peut être mise à jour périodiquement pour refléter les changements dans nos 
                pratiques ou pour des raisons légales et réglementaires.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nous vous informerons de tout changement significatif par email et via une notification sur 
                la plateforme au moins 30 jours avant l'entrée en vigueur.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-muted-foreground text-sm">
                  Version actuelle : 2.1 - Septembre 2025
                </p>
                <a 
                  href="#" 
                  className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
                >
                  Voir l'historique des versions →
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