'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Car, Key } from 'lucide-react';
import { Card, Button } from './ui';

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
    <section className="relative z-10 mt-6 md:-mt-60 lg:-mt-72 px-4 md:px-8 pb-12">
      {/* Ajustement de la largeur maximale pour 2 cartes */}
      <div className="max-w-5xl mx-auto">
        {/* Changement de la grille pour afficher 2 colonnes au lieu de 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overlayData.map((card, index) => (
            <Card
              key={index}
              className="p-6 md:p-8 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-primary/10 dark:hover:shadow-primary/20 hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3.5 rounded-full bg-primary/10 dark:bg-primary/25 text-primary">
                  <card.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-h2 text-foreground">
                  {card.title}
                </h3>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6 text-body">
                {card.description}
              </p>

              <Button href={card.linkHref} size="lg" className="w-full">
                {card.linkText}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCardsOverlay;