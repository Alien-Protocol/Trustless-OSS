import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'solid' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  solid: 'ui-button ui-button-solid',
  outline: 'ui-button ui-button-outline',
  ghost: 'ui-button ui-button-ghost',
  danger: 'ui-button ui-button-danger',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

type ButtonBase = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
    external?: never;
  };

type ButtonAsLink = ButtonBase & {
  href: string;
  external?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLAnchorElement>['onClick'];
  'aria-label'?: string;
  title?: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return 'href' in props && typeof props.href === 'string';
}

export default function Button(props: ButtonProps) {
  const variant = props.variant ?? 'solid';
  const size = props.size ?? 'md';
  const className = props.className ?? '';
  const classes = `${variantClass[variant]} ${sizeClass[size]} ${className}`.trim();

  if (isLinkProps(props)) {
    const { href, external, onClick, title, children } = props;
    const ariaLabel = props['aria-label'];

    if (external) {
      return (
        <a
          href={href}
          onClick={onClick}
          title={title}
          aria-label={ariaLabel}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} onClick={onClick} title={title} aria-label={ariaLabel} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    children,
    variant: _variant,
    size: _size,
    className: _className,
    ...rest
  } = props as ButtonAsButton;

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
