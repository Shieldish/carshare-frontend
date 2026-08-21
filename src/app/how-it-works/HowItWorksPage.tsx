'use client';
/* eslint-disable react/no-unescaped-entities */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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

const STEP_ICONS = [Car, Calendar, CheckCircle];
const OWNER_STEP_ICONS = [Camera, MessageSquare, TrendingUp];
const BENEFIT_ICONS = [Users, DollarSign];
const BENEFIT_COLORS = ['blue', 'green'];
const SAFETY_ICONS = [UserCheck, Shield, CreditCard, Clock];

const HowItWorksPage = () => {
  const t = useTranslations('howItWorks');
  const { user, isLoading } = useAuth();

  const steps = useMemo(() => {
    const raw = t.raw('steps') as { title: string; description: string; details: string[] }[];
    return raw.map((step, i) => ({ id: i + 1, ...step, icon: STEP_ICONS[i] }));
  }, [t]);

  const ownerSteps = useMemo(() => {
    const raw = t.raw('ownerSteps') as { title: string; description: string }[];
    return raw.map((step, i) => ({ ...step, icon: OWNER_STEP_ICONS[i] }));
  }, [t]);

  const benefits = useMemo(() => {
    const raw = t.raw('benefits') as { title: string; subtitle: string; points: string[] }[];
    return raw.map((b, i) => ({ ...b, icon: BENEFIT_ICONS[i], color: BENEFIT_COLORS[i] }));
  }, [t]);

  const safetyFeatures = useMemo(() => {
    const raw = t.raw('safetyFeatures') as { title: string; description: string }[];
    return raw.map((f, i) => ({ ...f, icon: SAFETY_ICONS[i] }));
  }, [t]);

  // Fonction pour déterminer le lien du bouton "Gagner avec ma voiture"
  const getEarnMoneyLink = () => {
    if (isLoading) return '/login?redirect=/vehicles'; // Par défaut pendant le chargement
    return user ? '/vehicles' : '/login?redirect=/vehicles';
  };

  // Fonction pour déterminer le texte du bouton
  const getEarnMoneyButtonText = () => {
    if (isLoading) return t('ctaEarnLoading');
    return user ? t('ctaEarnLoggedIn') : t('ctaEarnLoggedOut');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* How it Works for Renters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('rentersTitle')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('rentersSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="bg-card rounded-xl shadow-lg p-8 h-full border border-border">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mb-6 mx-auto">
                  <step.icon className="h-8 w-8 text-primary" />
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
            {t('ownersTitle')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('ownersSubtitle')}
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
          <h3 className="text-2xl font-bold mb-4">{t('calculatorTitle')}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold">300$</div>
              <div className="opacity-90">{t('calcMinLabel')}</div>
              <div className="text-sm opacity-75">{t('calcMinSub')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold">550$</div>
              <div className="opacity-90">{t('calcAvgLabel')}</div>
              <div className="text-sm opacity-75">{t('calcAvgSub')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold">800$</div>
              <div className="opacity-90">{t('calcMaxLabel')}</div>
              <div className="text-sm opacity-75">{t('calcMaxSub')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Security */}
      <div className="bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('safetyTitle')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('safetySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full mb-4 mx-auto">
                    <feature.icon className="h-6 w-6 text-primary" />
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
              {t('techTitle')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{t('techMobileTitle')}</h3>
                  <p className="text-muted-foreground">{t('techMobileDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{t('techPaymentTitle')}</h3>
                  <p className="text-muted-foreground">{t('techPaymentDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{t('techGeoTitle')}</h3>
                  <p className="text-muted-foreground">{t('techGeoDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{t('techPhotoTitle')}</h3>
                  <p className="text-muted-foreground">{t('techPhotoDesc')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">{t('whyChooseTitle')}</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>{t('whyPoint1')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span>{t('whyPoint2')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>{t('whyPoint3')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-400" />
                <span>{t('whyPoint4')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-400" />
                <span>{t('whyPoint5')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('ctaTitle')}
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {t('ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2 group"
            >
              <Car className="h-5 w-5" />
              <span>{t('ctaFindCar')}</span>
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
            {t('ctaFooter')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;