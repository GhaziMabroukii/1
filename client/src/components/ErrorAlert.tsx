import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, CheckCircle, XCircle } from "lucide-react";

interface ErrorAlertProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ type = 'error', title, message, details, onDismiss }: ErrorAlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success': return 'Succès';
      case 'warning': return 'Attention';
      case 'info': return 'Information';
      default: return 'Erreur';
    }
  };

  return (
    <Alert className={`${getStyles()} border-l-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">
              {title || getDefaultTitle()}
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            {message}
          </AlertDescription>
          {details && (
            <div className="mt-3 p-3 bg-white/50 rounded border border-current/20">
              <p className="text-xs font-mono text-gray-600">{details}</p>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}