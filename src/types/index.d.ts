// Type declarations for modules
declare module 'react' {
  export = React;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const Volume2: ComponentType<IconProps>;
  export const VolumeX: ComponentType<IconProps>;
  export const Play: ComponentType<IconProps>;
  export const Pause: ComponentType<IconProps>;
  export const SkipForward: ComponentType<IconProps>;
  export const SkipBack: ComponentType<IconProps>;
  export const Wifi: ComponentType<IconProps>;
  export const WifiOff: ComponentType<IconProps>;
  export const QrCode: ComponentType<IconProps>;
  export const Copy: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
}

// Add JSX namespace to fix "JSX element implicitly has type 'any'" errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
