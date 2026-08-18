'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQPage = () => {
  const t = useTranslations('faq');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const faqData: FAQItem[] = useMemo(() => {
    const rawItems = t.raw('items') as { question: string; answer: string }[];
    return rawItems.map((item, index) => ({ id: index + 1, ...item }));
  }, [t]);

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
              {t('headerTitle')}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              {t('headerSubtitle')}
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
                placeholder={t('searchPlaceholder')}
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
                  {t('noResults', { term: searchTerm })}
                </p>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-3xl p-8 text-center text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-4">
              {t('contactTitle')}
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              {t('contactSubtitle')}
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/25779123456?text=Bonjour%2C%20j%27ai%20une%20question%20concernant%20BudaxDrive."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {t('contactButton')}
              </a>
              <a
                href="mailto:support@carshareburundi.com"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {t('emailButton')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;