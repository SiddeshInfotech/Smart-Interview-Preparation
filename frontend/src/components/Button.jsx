import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  as = 'button',
  className = '',
  icon = null,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    full ? 'btn--full' : '',
    className
  ].filter(Boolean).join(' ')

  const Tag = as
  return (
    <Tag className={classes} {...rest}>
      {icon}
      {children}
    </Tag>
  )
}