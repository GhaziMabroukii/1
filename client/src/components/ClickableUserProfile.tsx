import React from 'react';
import { useLocation } from 'wouter';
import UserAvatar from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

interface ClickableUserProfileProps {
  user: {
    id?: number;
    profilePicture?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string;
    email?: string;
  };
  showName?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  nameClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function ClickableUserProfile({ 
  user, 
  showName = false,
  size = "md",
  className = "",
  nameClassName = "",
  disabled = false,
  children
}: ClickableUserProfileProps) {
  const [, navigate] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !user?.id) return;
    
    navigate(`/profile/${user.id}`);
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.username || user?.email || 'Utilisateur';

  const content = (
    <>
      <UserAvatar 
        user={user}
        size={size}
        className={cn(
          !disabled && user?.id && "transition-transform hover:scale-105",
          className
        )}
      />
      {showName && (
        <span className={cn(
          "text-sm font-medium truncate",
          !disabled && user?.id && "hover:text-primary transition-colors cursor-pointer",
          nameClassName
        )}>
          {displayName}
        </span>
      )}
      {children}
    </>
  );

  if (disabled || !user?.id) {
    return <div className="flex items-center space-x-2">{content}</div>;
  }

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center space-x-2 cursor-pointer transition-all duration-200",
        "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1 -m-1"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
      data-testid={`clickable-user-profile-${user.id}`}
    >
      {content}
    </div>
  );
}