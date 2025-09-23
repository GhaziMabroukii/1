import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

const BackButton = ({ to, label = "Retour", className = "" }: BackButtonProps) => {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      // Go back in browser history
      window.history.back();
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className={`flex items-center space-x-2 text-foreground hover:text-primary transition-colors ${className}`}
      data-testid="back-button"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;