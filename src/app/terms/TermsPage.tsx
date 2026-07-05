'use client';
/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import { Shield, Users, Car, CreditCard, AlertTriangle, FileText, Phone, Mail } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-800 dark:via-purple-800 dark:to-blue-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Conditions d'Utilisation
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Conditions générales d'utilisation de la plateforme CarShare Burundi
            </p>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Last Updated */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Dernière mise à jour :</strong> 15 septembre 2025
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              1. Introduction
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Bienvenue sur CarShare Burundi, la plateforme de location de véhicules entre particuliers au Burundi. 
                En utilisant nos services, vous acceptez d'être lié par ces conditions d'utilisation.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CarShare Burundi ("nous", "notre", "nos") exploite le site web carshareburundi.com et l'application mobile 
                CarShare Burundi (collectivement, le "Service").
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ces conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent ou utilisent le Service.
              </p>
            </div>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Users className="w-8 h-8 mr-3 text-green-600" />
              2. Définitions
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Propriétaire</h3>
                  <p className="text-muted-foreground text-sm">
                    Personne physique qui met son véhicule personnel en location via la plateforme.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Locataire</h3>
                  <p className="text-muted-foreground text-sm">
                    Personne physique qui loue un véhicule via la plateforme.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Véhicule</h3>
                  <p className="text-muted-foreground text-sm">
                    Tout véhicule automobile proposé en location sur la plateforme.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Réservation</h3>
                  <p className="text-muted-foreground text-sm">
                    Contrat de location entre un propriétaire et un locataire via la plateforme.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Shield className="w-8 h-8 mr-3 text-purple-600" />
              3. Comptes Utilisateur
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">3.1 Création de compte</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Vous devez être âgé d'au moins 21 ans pour créer un compte</li>
                <li>Vous devez fournir des informations exactes et complètes</li>
                <li>Vous êtes responsable de la sécurité de votre mot de passe</li>
                <li>Un seul compte par personne est autorisé</li>
              </ul>
              
              <h3 className="font-semibold text-xl mb-4 text-foreground">3.2 Vérification d'identité</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Pièce d'identité nationale ou passeport valide</li>
                <li>Permis de conduire en cours de validité</li>
                <li>Justificatif de domicile récent</li>
                <li>Photo de profil récente et claire</li>
              </ul>
            </div>
          </section>

          {/* Vehicle Rentals */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <Car className="w-8 h-8 mr-3 text-blue-600" />
              4. Location de Véhicules
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">4.1 Conditions de location</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Âge minimum : 21 ans (25 ans pour certains véhicules premium)</li>
                <li>Permis de conduire valide depuis au moins 2 ans</li>
                <li>Aucune suspension de permis en cours</li>
                <li>Carte bancaire valide pour la caution</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">4.2 Utilisation du véhicule</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Usage personnel uniquement (pas commercial)</li>
                <li>Respect du code de la route du Burundi</li>
                <li>Interdiction de sous-location</li>
                <li>Nombre maximum de conducteurs : 2 (déclarés)</li>
                <li>Transport de matières dangereuses interdit</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">4.3 Restitution</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Retour à l'heure et lieu convenus</li>
                <li>Véhicule dans le même état qu'au départ</li>
                <li>Réservoir de carburant au même niveau</li>
                <li>Restitution des clés et documents</li>
              </ul>
            </div>
          </section>

          {/* Payments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-green-600" />
              5. Paiements et Tarification
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">5.1 Prix et frais</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Prix fixés librement par les propriétaires</li>
                <li>Commission CarShare Burundi : 15% du montant de la location</li>
                <li>Frais de traitement des paiements inclus</li>
                <li>Assurance obligatoire incluse dans le prix</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">5.2 Caution</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Montant : 100 000 à 500 000 FBU selon le véhicule</li>
                <li>Préautorisation sur carte bancaire</li>
                <li>Libération automatique 7 jours après restitution</li>
                <li>Retenue en cas de dommages ou d'infractions</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">5.3 Moyens de paiement</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Orange Money</li>
                <li>Eco Cash</li>
                <li>Cartes bancaires internationales</li>
                <li>Virements bancaires</li>
              </ul>
            </div>
          </section>

          {/* Responsibilities */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
              <AlertTriangle className="w-8 h-8 mr-3 text-red-600" />
              6. Responsabilités
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="font-semibold text-xl mb-4 text-foreground">6.1 Responsabilité du locataire</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Utilisation conforme du véhicule</li>
                <li>Paiement des amendes et contraventions</li>
                <li>Signalement immédiat des dommages ou pannes</li>
                <li>Restitution dans les délais</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">6.2 Responsabilité du propriétaire</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Véhicule en bon état de fonctionnement</li>
                <li>Contrôle technique à jour</li>
                <li>Assurance véhicule valide</li>
                <li>Information sur les spécificités du véhicule</li>
              </ul>

              <h3 className="font-semibold text-xl mb-4 text-foreground">6.3 Responsabilité de CarShare Burundi</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Mise en relation entre propriétaires et locataires</li>
                <li>Traitement sécurisé des paiements</li>
                <li>Support client 7j/7</li>
                <li>Assurance complémentaire des locations</li>
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              7. Annulation et Remboursement
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 text-foreground font-semibold">Délai d'annulation</th>
                      <th className="py-3 text-foreground font-semibold">Remboursement</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-3">Plus de 24h avant</td>
                      <td className="py-3">100% (gratuit)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3">Entre 24h et 2h avant</td>
                      <td className="py-3">50%</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3">Moins de 2h avant</td>
                      <td className="py-3">Aucun remboursement</td>
                    </tr>
                    <tr>
                      <td className="py-3">Annulation propriétaire</td>
                      <td className="py-3">100% + dédommagement</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              8. Utilisations Interdites
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 shadow-lg border border-red-200 dark:border-red-800">
              <div className="grid md:grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
                <div>
                  <h3 className="font-semibold mb-2">Strictement interdit :</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Usage commercial non déclaré</li>
                    <li>Transport de passagers payants</li>
                    <li>Conduite sous influence</li>
                    <li>Courses automobiles</li>
                    <li>Transport de matières illégales</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sanctions :</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Suspension de compte</li>
                    <li>Résiliation définitive</li>
                    <li>Poursuites judiciaires</li>
                    <li>Non-prise en charge assurance</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              9. Contact et Support
            </h2>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-2xl p-8 text-white shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Support Téléphonique
                  </h3>
                  <p className="mb-2">+257 XX XX XX XX</p>
                  <p className="text-blue-100 text-sm">Lundi - Dimanche : 7h - 22h</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Support Email
                  </h3>
                  <p className="mb-2">support@carshareburundi.com</p>
                  <p className="text-blue-100 text-sm">Réponse sous 24h</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final Terms */}
          <section className="mb-12">
            <div className="bg-muted rounded-2xl p-8 shadow-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                Modification des Conditions
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CarShare Burundi se réserve le droit de modifier ces conditions à tout moment. 
                Les utilisateurs seront notifiés par email des modifications importantes.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                L'utilisation continue du service après modification constitue l'acceptation des nouvelles conditions.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;