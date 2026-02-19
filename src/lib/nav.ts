export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', rolesAllowed: ['MEMBER','MANAGER','CEO'] },
  { label: 'Products', href: '/dashboard/products', rolesAllowed: ['MEMBER','MANAGER','CEO'] },
  { label: 'Auctions', href: '/dashboard/auctions', rolesAllowed: ['MEMBER','MANAGER','CEO'] },
  { label: 'Settings', href: '/dashboard/settings', rolesAllowed: ['MANAGER','CEO'] },
  { label: 'Orders', href: '/dashboard/orders', rolesAllowed: ['MEMBER','MANAGER','CEO'] },
  { label: 'Admin', href: '/dashboard/admin', rolesAllowed: ['CEO'] },
  { label: 'Founder', href: '/dashboard/founder', rolesAllowed: ['CEO'] }
];

export default NAV_ITEMS;
