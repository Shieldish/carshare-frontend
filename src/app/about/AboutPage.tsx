'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Car, Users, Shield, Globe, TrendingUp, Heart, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AboutPage = () => {
  const t = useTranslations('about');
  const { user, isLoading } = useAuth();

  // Fonction pour déterminer le lien du bouton "Proposer mon Véhicule"
  const getEarnMoneyLink = () => {
    if (isLoading) return '/login?redirect=/vehicles'; // Par défaut pendant le chargement
    return user ? '/vehicles' : '/login?redirect=/vehicles';
  };

  // Fonction pour déterminer le texte du bouton
  const getEarnMoneyButtonText = () => {
    if (isLoading) return t('cta.earnButtonLoading');
    return user ? t('cta.earnButtonLoggedIn') : t('cta.earnButtonLoggedOut');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                CarShare Burundi
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
                {t('hero.subtitlePrefix')} <span className="font-semibold text-blue-600">{t('hero.subtitleHighlight')}</span> {t('hero.subtitleSuffix')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-lg border border-border">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-card-foreground">{t('hero.badge1')}</span>
                </div>
                <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-lg border border-border">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-card-foreground">{t('hero.badge2')}</span>
                </div>
                <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-lg border border-border">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-card-foreground">{t('hero.badge3')}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold">15,000+</div>
                    <div className="text-sm opacity-90">{t('hero.statVehiclesLabel')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">300k+</div>
                    <div className="text-sm opacity-90">{t('hero.statVisitorsLabel')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">-40%</div>
                    <div className="text-sm opacity-90">{t('hero.statSavingsLabel')}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-sm opacity-90">{t('hero.statSupportLabel')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              {t('mission.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('mission.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('mission.communityTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('mission.communityDescription')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('mission.accessibilityTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('mission.accessibilityDescription')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('mission.innovationTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('mission.innovationDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8 text-foreground">
                {t('challenge.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('challenge.highPricesTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('challenge.highPricesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('challenge.underuseTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('challenge.underuseDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('challenge.trustTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('challenge.trustDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-8 text-foreground">
                {t('solution.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('solution.securePlatformTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('solution.securePlatformDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('solution.affordablePricesTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('solution.affordablePricesDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('solution.extraIncomeTitle')}</h3>
                    <p className="text-muted-foreground">
                      {t('solution.extraIncomeDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              {t('process.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('process.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Car className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('process.step1Title')}
              </h3>
              <p className="text-muted-foreground">
                {t('process.step1Description')}
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('process.step2Title')}
              </h3>
              <p className="text-muted-foreground">
                {t('process.step2Description')}
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('process.step3Title')}
              </h3>
              <p className="text-muted-foreground">
                {t('process.step3Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              {t('values.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{t('values.securityTitle')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('values.securityDescription')}
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{t('values.trustTitle')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('values.trustDescription')}
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{t('values.excellenceTitle')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('values.excellenceDescription')}
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{t('values.impactTitle')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('values.impactDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">{t('stats.title')}</h2>
            <p className="text-xl opacity-90">{t('stats.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">15k+</div>
              <div className="text-lg opacity-90">{t('stats.vehiclesLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">300k+</div>
              <div className="text-lg opacity-90">{t('stats.visitorsLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">40%</div>
              <div className="text-lg opacity-90">{t('stats.savingsLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">800$</div>
              <div className="text-lg opacity-90">{t('stats.revenueLabel')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-card">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center"
            >
              {t('cta.rentButton')}
            </Link>
            <Link
              href={getEarnMoneyLink()}
              className={`border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center ${
                isLoading ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              {getEarnMoneyButtonText()}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;