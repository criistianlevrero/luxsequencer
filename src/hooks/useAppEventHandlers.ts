import { useCallback } from 'react';
import { useTextureStore } from '../store';
import { useTranslation } from '../i18n/hooks/useTranslation';

export const useAppEventHandlers = () => {
  const { t } = useTranslation();
  const resetToDefault = useTextureStore(state => state.resetToDefault);

  const handleResetToDefault = useCallback(() => {
    const confirmReset = window.confirm(
      t('error.resetConfirmation')
    );
    if (confirmReset) {
      resetToDefault();
    }
  }, [resetToDefault, t]);

  return {
    handleResetToDefault
  };
};
