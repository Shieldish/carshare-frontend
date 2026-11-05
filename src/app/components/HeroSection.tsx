'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSliderData } from '../page';

interface HeroSectionProps {
  featuredPromotions: HeroSliderData[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ featuredPromotions }) => {
  const t = useTranslations('home.hero');

  const defaultSlides: HeroSliderData[] = [
    {
      vehicleId: 0,
      title: t('defaultSlide1Title'),
      imageUrl: 'https://res.cloudinary.com/dzwfox4id/image/upload/v1785142825/budaxdrive/banners/nf0lwyvgxxzwykaxtn6o.png',
    },
    {
      vehicleId: 0,
      title: t('defaultSlide2Title'),
      imageUrl: 'https://res.cloudinary.com/dzwfox4id/image/upload/v1785142827/budaxdrive/banners/d9rrxqkduw92y5hea9os.png',
    },
    {
      vehicleId: 0,
      title: t('defaultSlide3Title'),
      imageUrl: 'https://res.cloudinary.com/dzwfox4id/image/upload/v1785142823/budaxdrive/banners/icsixryqh3zhqpxpuykz.jpg',
    },
  ];

  const originalSlides = featuredPromotions && featuredPromotions.length > 0 ? featuredPromotions : defaultSlides;
  const hasMultipleSlides = originalSlides.length > 1;

  const slides = hasMultipleSlides
    ? [originalSlides[originalSlides.length - 1], ...originalSlides, originalSlides[0]]
    : originalSlides;

  const [currentIndex, setCurrentIndex] = useState(hasMultipleSlides ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCurrentIndex(hasMultipleSlides ? 1 : 0);
  }, [hasMultipleSlides]);

  const goToNext = useCallback(() => {
    if (!hasMultipleSlides) return;
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isTransitioning, hasMultipleSlides]);

  const goToPrevious = useCallback(() => {
    if (!hasMultipleSlides) return;
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [isTransitioning, hasMultipleSlides]);

  useEffect(() => {
    if (!hasMultipleSlides || isHovered) return;

    const startTimer = () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, 5000);
    };

    const stopTimer = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };

    if (typeof document !== 'undefined' && !document.hidden) {
      startTimer();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) stopTimer();
      else startTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasMultipleSlides, isHovered, goToNext]);

  const handleTransitionEnd = () => {
    if (!hasMultipleSlides) return;

    if (currentIndex >= originalSlides.length + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    } 
    else if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(originalSlides.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleSlides) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasMultipleSlides) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!hasMultipleSlides || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) goToNext();
    else if (distance < -50) goToPrevious();

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <section
      className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label={t('ariaFeatured')}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${hasMultipleSlides ? currentIndex * 100 : 0}%)`,
          transition: isTransitioning ? 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((slide, index) => (
          <div
            key={`${slide.vehicleId || 'default'}-${index}`}
            className="relative flex-none w-full h-full"
            aria-hidden={hasMultipleSlides ? index !== currentIndex : false}
          >
            <HeroSlide slide={slide} priority={index === (hasMultipleSlides ? 1 : 0)} />
          </div>
        ))}
      </div>

      {hasMultipleSlides && (
        <>
          <button
            onClick={goToPrevious}
            className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30
                       p-2.5 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full
                       hover:bg-white/40 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-white/50
                       group shadow-lg opacity-100 translate-x-0 ${
                         isHovered ? 'md:opacity-100 md:translate-x-0' : 'md:opacity-0 md:-translate-x-4'
                       }`}
            aria-label={t('ariaPrevious')}
          >
            <ChevronLeft className="w-5 h-5 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={goToNext}
            className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30
                       p-2.5 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full
                       hover:bg-white/40 transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-white/50
                       group shadow-lg opacity-100 translate-x-0 ${
                         isHovered ? 'md:opacity-100 md:translate-x-0' : 'md:opacity-0 md:translate-x-4'
                       }`}
            aria-label={t('ariaNext')}
          >
            <ChevronRight className="w-5 h-5 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center">
            {originalSlides.map((_, idx) => {
              let activeIdx = currentIndex - 1;
              if (currentIndex === 0) activeIdx = originalSlides.length - 1;
              if (currentIndex === originalSlides.length + 1) activeIdx = 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentIndex(idx + 1);
                  }}
                  aria-label={t('ariaGoToSlide', { index: idx + 1 })}
                  aria-current={activeIdx === idx}
                  className="p-2 flex items-center justify-center"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 shadow-md ${
                      activeIdx === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

const HeroSlide: React.FC<{
  slide: HeroSliderData;
  priority?: boolean;
}> = ({ slide, priority = false }) => {
  const t = useTranslations('home.hero');
  const isDefault = slide.vehicleId === 0;

  const content = (
    <div className="relative w-full h-full">
      <Image
        src={slide.imageUrl}
        alt={slide.title}
        fill
        priority={priority}
        className="object-cover"
        sizes="100vw"
        quality={90}
      />

      {isDefault && (
        <>
          {/* Voile uniforme : les visuels "par défaut" contiennent déjà du texte
              promotionnel incrusté dans l'image, dimensionné pour un cadrage très
              large. Un dégradé directionnel laisse des coins non assombris où ce
              texte redevient lisible et entre en collision avec le titre HTML
              ci-dessous — on applique donc un voile plein, uniforme à tout cadrage.
              Pas de backdrop-blur ici : combiné à la transformation CSS du
              carrousel (translateX animé), un flou plein cadre provoquait un
              artefact de compositing au redimensionnement en direct. */}
          <div className="absolute inset-0 bg-black/85" />
          <div className="absolute inset-0 flex flex-col justify-start items-end p-8 md:p-16 pt-24 md:pt-32">
            {/* pt-24 md:pt-32 assure que le texte n'est pas caché sous la TopAppBar */}
            <div className="max-w-xl text-right">
              {/* Séquence d'entrée orchestrée (badge → titre → description), un seul
                  endroit dans toute l'app où cette animation "hero" est utilisée. */}
              <span
                className="opacity-0 animate-hero-in inline-block px-3 py-1 bg-primary text-primary-foreground text-small font-semibold rounded-full mb-3 shadow-lg"
                style={{ animationDelay: '75ms' }}
              >
                {t('brandBadge')}
              </span>
              <h1
                className="opacity-0 animate-hero-in font-display text-display text-white mb-3 drop-shadow-lg"
                style={{ animationDelay: '150ms' }}
              >
                {slide.title}
              </h1>
              <p
                className="hidden sm:block opacity-0 animate-hero-in text-body text-gray-200 drop-shadow-md font-medium max-w-md ml-auto"
                style={{ animationDelay: '225ms' }}
              >
                {t('defaultDescription')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (!isDefault) {
    return (
      <Link
        href={`/vehicles/${slide.vehicleId}`}
        className="block w-full h-full cursor-pointer"
        aria-label={t('ariaViewDetails', { title: slide.title })}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default HeroSection;