// Thin wrapper over sonner so components can call: const { toast } = useToast()
import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: ({ title, description, variant } = {}) => {
      const message = title || description || '';
      if (variant === 'destructive') {
        sonnerToast.error(message, { description: title ? description : undefined });
      } else {
        sonnerToast.success(message, { description: title ? description : undefined });
      }
    },
  };
}
