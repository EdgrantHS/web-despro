'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useLoading } from '@/contexts/LoadingContext';

interface LoadingLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  onClick?: () => void;
}

export function LoadingLink({ 
  href, 
  children, 
  className, 
  loadingMessage = 'Loading...', 
  onClick 
}: LoadingLinkProps) {
  const router = useRouter();
  const { setLoading } = useLoading();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    setLoading(true, loadingMessage);
    router.push(href);
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}