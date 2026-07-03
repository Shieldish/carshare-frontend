'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Comment fonctionne la location de voitures entre particuliers ?",
    answer: "CarShare Burundi met en relation des propriétaires de voitures avec des personnes souhaitant louer un véhicule. Les propriétaires publient leurs annonces avec photos, prix et disponibilités. Les locataires peuvent parcourir les offres, réserver directement en ligne et récupérer la voiture au lieu convenu."
  },
  {
    id: 2,
    question: "Comment puis-je m'inscrire sur la plateforme ?",
    answer: "L'inscription est simple et gratuite. Il vous suffit de cliquer sur 'S'inscrire', de fournir vos informations personnelles, une pièce d'identité valide et votre permis de conduire. Une fois votre compte vérifié, vous pouvez commencer à louer ou mettre votre voiture en location."
  },
  {
    id: 3,
    question: "Quels documents dois-je fournir pour louer une voiture ?",
    answer: "Pour louer une voiture, vous devez présenter : un permis de conduire valide (national ou international), une pièce d'identité en cours de validité, et une carte bancaire pour la caution. Certains propriétaires peuvent demander des documents supplémentaires."
  },
  {
    id: 4,
    question: "Comment les prix sont-ils fixés ?",
    answer: "Les prix sont librement fixés par les propriétaires en fonction du modèle de véhicule, de l'année, des équipements et de la demande. Notre plateforme affiche des prix transparents incluant les frais de service. Vous pouvez comparer facilement les offres."
  },
  {
    id: 5,
    question: "Que faire en cas d'accident ou de panne ?",
    answer: "En cas d'accident, contactez immédiatement les autorités et notre service client 24h/7j. Chaque location est couverte par une assurance. En cas de panne, nous disposons d'un réseau de dépannage. Tous les numéros d'urgence sont fournis lors de la remise des clés."
  },
  {
    id: 6,
    question: "Comment fonctionne le système de caution ?",
    answer: "Une caution est préautorisée sur votre carte bancaire au moment de la prise du véhicule. Le montant varie selon le véhicule (généralement entre 100 000 et 500 000 FBU). Cette caution est libérée automatiquement 7 jours après le retour du véhicule, sauf en cas de dommages ou d'infractions."
  },
  {
    id: 7,
    question: "Puis-je annuler ma réservation ?",
    answer: "Oui, vous pouvez annuler votre réservation selon les conditions d'annulation du propriétaire. Généralement : annulation gratuite jusqu'à 24h avant le début de la location, 50% de remboursement entre 24h et 2h avant, aucun remboursement moins de 2h avant."
  },
  {
    id: 8,
    question: "Comment mettre ma voiture en location ?",
    answer: "Pour mettre votre voiture en location : créez votre annonce avec photos de qualité, définissez vos prix et disponibilités, indiquez votre zone de remise du véhicule. Nous vérifions votre véhicule et vos documents. Une fois validé, votre annonce est publiée et vous commencez à recevoir des demandes."
  },
  {
    id: 9,
    question: "CarShare Burundi prélève-t-il des commissions ?",
    answer: "Oui, nous prélevons une commission de service de 15% sur chaque location pour couvrir l'assurance, le support client, le traitement des paiements et la maintenance de la plateforme. Cette commission est transparente et incluse dans le prix affiché."
  },
  {
    id: 10,
    question: "Dans quelles villes CarShare Burundi est-il disponible ?",
    answer: "CarShare Burundi est actuellement disponible à Bujumbura, Gitega, Ngozi et Bururi. Nous prévoyons d'étendre nos services à d'autres villes du pays en 2025. Suivez nos actualités pour être informé des nouvelles zones de couverture."
  },
  {
    id: 11,
    question: "Comment contacter le support client ?",
    answer: "Notre équipe support est disponible du lundi au dimanche de 7h à 22h. Vous pouvez nous contacter par téléphone au +257 XX XX XX XX, par email à support@carshareburundi.com, ou via le chat en direct sur notre site web."
  },
  {
    id: 12,
    question: "Les véhicules sont-ils assurés ?",
    answer: "Oui, tous les véhicules loués via CarShare Burundi bénéficient d'une couverture d'assurance complète incluant la responsabilité civile, les dommages au véhicule et le vol. Les détails de la couverture sont disponibles dans nos conditions générales."
  }
];

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-800 dark:via-purple-800 dark:to-blue-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Questions Fréquemment Posées
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Trouvez rapidement les réponses à vos questions sur CarShare Burundi
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Recherchez une question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border border-border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card text-foreground shadow-lg placeholder:text-muted-foreground"
              />
              <Search className="absolute right-4 top-4 h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.length > 0 ? (
              filteredFAQ.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-muted rounded-2xl transition-colors duration-200"
                  >
                    <span className="text-lg font-semibold text-foreground pr-4">
                      {item.question}
                    </span>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {openItems.includes(item.id) && (
                    <div className="px-8 pb-6 border-t border-border pt-6 mt-2">
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Aucune question trouvée pour "{searchTerm}"
                </p>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-3xl p-8 text-center text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-4">
              Vous ne trouvez pas votre réponse ?
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              Notre équipe support est là pour vous aider 24h/7j
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Nous contacter
              </a>
              <a
                href="mailto:support@carshareburundi.com"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Envoyer un email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;