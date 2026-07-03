// Solution 1: Modifier ConfirmDeleteModal.tsx avec un background plus compatible
import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleName: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  vehicleName,
  isLoading = false
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* SOLUTION 1: Background avec opacité plus forte et sans backdrop-blur */}
      <div 
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* OU SOLUTION 2: Background avec backdrop-blur forcé via style */}
      {/* 
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        style={{ 
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)' // Pour Safari
        }}
        onClick={!isLoading ? onClose : undefined}
      ></div>
      */}

      {/* Contenu modal avec animation d'entrée */}
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
        {/* Icône d'alerte */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Supprimer la réservation
          </h2>
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer la réservation pour{' '}
            <span className="font-semibold text-gray-800">{vehicleName}</span> ?
          </p>
          <p className="text-sm text-red-600 mt-2">
            Cette action est irréversible.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Suppression...
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

// ===================================
// SOLUTION ALTERNATIVE: CSS personnalisé
// ===================================

// Vous pouvez aussi ajouter du CSS personnalisé dans votre projet:

/*
Dans votre fichier globals.css ou un fichier CSS:

.modal-backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-backdrop.no-blur {
  background: rgba(0, 0, 0, 0.7);
}

.modal-enter {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: opacity 300ms ease, transform 300ms ease;
}
*/

// Et l'utiliser comme ceci:
// <div className="absolute inset-0 modal-backdrop"></div>