import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon, 
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      name: 'Financial Tracking',
      description: 'Efficiently track tithes, offerings, and all church financial transactions with real-time updates.',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Member Management',
      description: 'Maintain detailed records of church members, their contributions, and generate member cards.',
      icon: UserGroupIcon,
    },
    {
      name: 'Analytics Dashboard',
      description: 'Visualize financial trends and patterns with interactive charts and detailed reports.',
      icon: ChartBarIcon,
    },
    {
      name: 'Report Generation',
      description: 'Generate comprehensive financial reports, receipts, and statements with one click.',
      icon: DocumentChartBarIcon,
    },
  ];

  const testimonials = [
    {
      name: "Pastor John Doe",
      role: "Senior Pastor",
      image: "/images/church-1.jpg",
      quote: "This system has revolutionized how we manage our church finances. It's intuitive and powerful."
    },
    {
      name: "Sarah Smith",
      role: "Church Administrator",
      image: "/images/church-2.jpg",
      quote: "The reporting features save us hours of work every week. Highly recommended!"
    },
    {
      name: "Michael Johnson",
      role: "Finance Committee Head",
      image: "/images/church-3.jpg",
      quote: "The analytics help us make better financial decisions for our church."
    }
  ];

  return (
    <div className="bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Navigation */}
      <motion.nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ... navigation content ... */}
      </motion.nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        {/* ... hero content ... */}
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        {/* ... features content ... */}
      </div>

      {/* About Section */}
      <div id="about" className="py-16 bg-primary-50/60 dark:bg-gray-900/60 backdrop-blur-sm">
        {/* ... about content ... */}
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-b from-white/60 to-primary-50/60 dark:from-gray-800/60 dark:to-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              What Church Leaders Say
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Trusted by church leaders around the world
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                <div className="relative bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg transform transition-all duration-300 group-hover:shadow-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-r from-primary-600 to-primary-400 p-1">
                      <div className="h-full w-full rounded-full overflow-hidden">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <svg className="h-8 w-8 text-primary-400" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 italic">
                      {testimonial.quote}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="py-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        {/* ... contact content ... */}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm">
        {/* ... footer content ... */}
      </footer>
    </div>
  );
};

export default LandingPage; 