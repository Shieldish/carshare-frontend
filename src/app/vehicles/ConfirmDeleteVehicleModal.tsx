// ConfirmDeleteVehicleModal.tsx
import React from 'react';

interface ConfirmDeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleName: string;
  isLoading?: boolean;
}

const ConfirmDeleteVehicleModal: React.FC<ConfirmDeleteVehicleModalProps> = ({ 
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
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
        {/* Warning icon */}
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
            Supprimer le véhicule
          </h2>
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer{' '}
            <span className="font-semibold text-gray-800">{vehicleName}</span> ?
          </p>
          <p className="text-sm text-red-600 mt-2">
            Cette action est irréversible et supprimera également toutes les réservations associées.
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

export default ConfirmDeleteVehicleModal;