'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  BookOpen,
  Package
} from 'lucide-react'

const menuItems = [
  { name: 'Categories', href: '/categories', icon: FileText },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Catalogues', href: '/catalogue', icon: BookOpen },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">Pashmiya</h1>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-slate-800 transition-colors ${
                isActive ? 'bg-slate-800 border-l-4 border-amber-500' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-slate-400">admin@pashmiya.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
