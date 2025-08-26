import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: {
    profilePicture?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string;
    email?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-16 w-16"
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm", 
  lg: "text-sm",
  xl: "text-lg"
};

export default function UserAvatar({ 
  user, 
  size = "md", 
  className, 
  fallbackClassName 
}: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className={cn(fallbackSizeClasses[size], "bg-muted", fallbackClassName)}>
          U
        </AvatarFallback>
      </Avatar>
    );
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 
                   user.username?.[0]?.toUpperCase() || 
                   user.email?.[0]?.toUpperCase() || 
                   'U';

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user.profilePicture && (
        <AvatarImage 
          src={user.profilePicture} 
          alt={`${user.firstName || user.username || 'User'}'s avatar`}
        />
      )}
      <AvatarFallback className={cn(
        fallbackSizeClasses[size], 
        "bg-primary text-primary-foreground font-semibold",
        fallbackClassName
      )}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}