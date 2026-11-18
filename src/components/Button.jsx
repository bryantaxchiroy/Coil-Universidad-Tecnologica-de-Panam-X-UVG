import { Link } from 'react-router-dom'

const styles = {
  primary: 'bg-ink text-white hover:bg-[#3a413a]',
  light: 'bg-white text-ink hover:bg-[#f0f1e9]',
  outline: 'border border-ink/20 bg-transparent text-ink hover:border-ink',
}

export default function Button({ to, children, variant = 'primary', className = '', ...props }) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${styles[variant]} ${className}`

  return to ? (
    <Link to={to} className={classes} {...props}>{children}</Link>
  ) : (
    <button className={classes} {...props}>{children}</button>
  )
}
