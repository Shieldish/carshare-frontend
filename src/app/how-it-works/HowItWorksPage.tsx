'use client';
/* eslint-disable react/no-unescaped-entities */

import React from 'react';
import Link from 'next/link';
import { 
  Car, 
  UserCheck, 
  CreditCard, 
  Shield, 
  MapPin, 
  Calendar,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Camera,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const HowItWorksPage = () => {
  const { user, isLoading } = useAuth();

  const steps = [
    {
      id: 1,
      title: "Trouvez la voiture parfaite",
      description: "Parcourez des centaines de voitures disponibles près de chez vous",
      icon: Car,
      details: [
        "Recherche par localisation et dates",
        "Filtres avancés par prix, type, équipements",
        "Photos détaillées et descriptions complètes",
        "Avis et notes des précédents locataires"
      ]
    },
    {
      id: 2,
      title: "Réservez en quelques clics",
      description: "Processus de réservation simple et sécurisé",
      icon: Calendar,
      details: [
        "Vérification instantanée de disponibilité",
        "Paiement sécurisé par Orange Money ou carte",
        "Confirmation immédiate par SMS/Email",
        "Communication directe avec le propriétaire"
      ]
    },
    {
      id: 3,
      title: "Récupérez et profitez",
      description: "Check-in facile et conduite en toute tranquillité",
      icon: CheckCircle,
      details: [
        "Rencontre avec le propriétaire au lieu convenu",
        "État des lieux photographique via l'app",
        "Assurance incluse pour votre protection",
        "Support 24h/7j en cas de besoin"
      ]
    }
  ];

  const ownerSteps = [
    {
      title: "Listez votre voiture",
      description: "Créez une annonce attractive en quelques minutes",
      icon: Camera
    },
    {
      title: "Recevez des demandes",
      description: "Acceptez ou refusez les réservations selon vos disponibilités",
      icon: MessageSquare
    },
    {
      title: "Gagnez de l'argent",
      description: "Recevez vos paiements automatiquement après chaque location",
      icon: TrendingUp
    }
  ];

  const benefits = [
    {
      title: "Pour les locataires",
      subtitle: "Une alternative flexible et économique",
      points: [
        "Prix jusqu'à 40% moins chers que les agences traditionnelles",
        "Large choix de véhicules (économiques, SUV, pickup, etc.)",
        "Location par heure, jour ou semaine",
        "Assurance comprise dans le prix",
        "Réservation 100% mobile"
      ],
      icon: Users,
      color: "blue"
    },
    {
      title: "Pour les propriétaires",
      subtitle: "Monétisez votre voiture facilement",
      points: [
        "Revenus de 300 à 800$/mois selon utilisation",
        "85% des revenus vous reviennent",
        "Vos véhicules sont assurés pendant les locations",
        "Gestion totalement digitalisée",
        "Vous gardez le contrôle de vos disponibilités"
      ],
      icon: DollarSign,
      color: "green"
    }
  ];

  const safetyFeatures = [
    {
      title: "Vérification des conducteurs",
      description: "Permis de conduire vérifié et contrôle d'antécédents",
      icon: UserCheck
    },
    {
      title: "Assurance complète",
      description: "Protection responsabilité civile et dommages véhicule incluse",
      icon: Shield
    },
    {
      title: "Paiements sécurisés",
      description: "Transactions protégées avec Orange Money et cartes bancaires",
      icon: CreditCard
    },
    {
      title: "Support 24h/7j",
      description: "Équipe dédiée disponible à tout moment pour vous aider",
      icon: Clock
    }
  ];

  // Fonction pour déterminer le lien du bouton "Gagner avec ma voiture"
  const getEarnMoneyLink = () => {
    if (isLoading) return '/login?redirect=/vehicles'; // Par défaut pendant le chargement
    return user ? '/vehicles' : '/login?redirect=/vehicles';
  };

  // Fonction pour déterminer le texte du bouton
  const getEarnMoneyButtonText = () => {
    if (isLoading) return 'Gagner avec ma voiture';
    return user ? 'Mes véhicules' : 'Gagner avec ma voiture';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Comment fonctionne CarShare Burundi
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              La première plateforme de partage de voitures entre particuliers au Burundi. 
              Simple, sécurisé et économique.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works for Renters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Louer une voiture n'a jamais été aussi simple
          </h2>
          <p className="text-xl text-muted-foreground">
            En 3 étapes, accédez à des centaines de voitures près de chez vous
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="bg-card rounded-xl shadow-lg p-8 h-full border border-border">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6 mx-auto">
                  <step.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-6 text-center">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center lg:text-left">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${benefit.color}-100 dark:bg-${benefit.color}-900 rounded-full mb-6`}>
                  <benefit.icon className={`h-8 w-8 text-${benefit.color}-600 dark:text-${benefit.color}-400`} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {benefit.subtitle}
                </p>
                <ul className="space-y-3">
                  {benefit.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-card-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works for Owners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Gagnez de l'argent avec votre voiture
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Votre voiture dort 70% du temps ? Transformez-la en source de revenus 
            avec CarShare Burundi
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {ownerSteps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6 mx-auto">
                  <step.icon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Calculator */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Calculateur de revenus</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold">300$</div>
              <div className="opacity-90">Revenus minimum/mois</div>
              <div className="text-sm opacity-75">5-10 locations/mois</div>
            </div>
            <div>
              <div className="text-3xl font-bold">550$</div>
              <div className="opacity-90">Revenus moyens/mois</div>
              <div className="text-sm opacity-75">15-20 locations/mois</div>
            </div>
            <div>
              <div className="text-3xl font-bold">800$</div>
              <div className="opacity-90">Revenus optimaux/mois</div>
              <div className="text-sm opacity-75">25+ locations/mois</div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Security */}
      <div className="bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Votre sécurité est notre priorité
            </h2>
            <p className="text-xl text-muted-foreground">
              Technologies et partenariats pour des locations en toute confiance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 mx-auto">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Une technologie 100% burundaise
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Application mobile native</h3>
                  <p className="text-muted-foreground">iOS et Android optimisées pour le marché local</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Paiements locaux intégrés</h3>
                  <p className="text-muted-foreground">Orange Money, Airtel Money et cartes bancaires</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Géolocalisation précise</h3>
                  <p className="text-muted-foreground">Trouvez des voitures près de chez vous à Bujumbura</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Camera className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">État des lieux digital</h3>
                  <p className="text-muted-foreground">Photos automatiques avant/après chaque location</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">Pourquoi choisir CarShare Burundi ?</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>Première plateforme locale de confiance</span>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span>Prix jusqu'à 40% moins chers</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>Assurance et protection incluses</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-400" />
                <span>Communauté vérifiée et bienveillante</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-400" />
                <span>Support client 24h/7j en français et kirundi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à rejoindre la révolution du transport au Burundi ?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Que vous souhaitiez louer une voiture ou gagner de l'argent avec la vôtre, 
            CarShare Burundi est fait pour vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2 group"
            >
              <Car className="h-5 w-5" />
              <span>Trouver une voiture</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={getEarnMoneyLink()}
              className={`bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center space-x-2 group ${
                isLoading ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span>{getEarnMoneyButtonText()}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Inscription gratuite • Sans engagement • Support en français
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;