import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Members', href: '/members', icon: UsersIcon },
  { name: 'Financial Form', href: '/financial-form', icon: CurrencyDollarIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Receipts', href: '/receipts', icon: DocumentTextIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Broadcast Email', href: '/broadcast', icon: EnvelopeIcon },
];

export default navigation; 