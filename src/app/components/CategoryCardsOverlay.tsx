'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Car, Key } from 'lucide-react';

const CategoryCardsOverlay: React.FC = () => {
  const t = useTranslations('home');

  const overlayData = [
    {
      icon: Car,
      title: t('categoryFindCar.title'),
      description: t('categoryFindCar.description'),
      linkText: t('categoryFindCar.linkText'),
      linkHref: '#vehicles-section',
    },
    {
      icon: Key,
      title: t('categoryBecomeOwner.title'),
      description: t('categoryBecomeOwner.description'),
      linkText: t('categoryBecomeOwner.linkText'),
      linkHref: '/vehicles/add',
    }
  ];

  return (
    <section className="relative z-10 -mt-52 md:-mt-60 lg:-mt-72 px-4 md:px-8 pb-12">
      {/* Ajustement de la largeur maximale pour 2 cartes */}
      <div className="max-w-5xl mx-auto">
        {/* Changement de la grille pour afficher 2 colonnes au lieu de 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overlayData.map((card, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-100/50 dark:border-gray-700/50 
                         transition-all duration-300 hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <card.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {card.title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-sm md:text-base">
                {card.description}
              </p>
              
              <Link
                href={card.linkHref}
                className="inline-flex items-center justify-center w-full px-6 py-3
                           bg-blue-600 text-white font-semibold rounded-xl
                           hover:bg-blue-700 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {card.linkText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCardsOverlay;