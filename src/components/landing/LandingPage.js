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
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const heroImages = [
    '/images/church-1.jpg',
    '/images/church-2.jpg',
    '/images/church-3.jpg',
    '/images/church-4.jpg',
  ];

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.8,
      }
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.8,
      }
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // Auto-advance carousel with smooth transitions
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => 
          prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsTransitioning(false), 1000);
      }
    }, 7000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [isTransitioning, heroImages.length]);

  const paginate = (newDirection) => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex + newDirection;
        if (nextIndex < 0) return heroImages.length - 1;
        if (nextIndex >= heroImages.length) return 0;
        return nextIndex;
      });
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

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
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen text-white">
      {/* Navigation */}
      <motion.nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-gray-900/90 backdrop-blur-lg shadow-lg' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <motion.img
                className="h-12 w-auto"
                src="/logo (2).png"
                alt="BIGOCA Logo"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
              <motion.span 
                className="ml-2 text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                BIGOCA
              </motion.span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'About', 'Contact'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`text-lg font-medium transition-colors duration-200 ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                      : 'text-gray-100 hover:text-white dark:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item}
                </motion.a>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Login
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {['Features', 'About', 'Contact'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <Link
                  to="/login"
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section with Enhanced Carousel */}
      <div className="relative min-h-screen flex items-center overflow-hidden">
        <AnimatePresence initial={false} custom={currentImageIndex}>
          <motion.div
            key={currentImageIndex}
            className="absolute inset-0 z-0"
            custom={currentImageIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.8 },
              scale: { duration: 0.8 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
          >
            <motion.div className="relative w-full h-full">
              {/* Background blurred image */}
              <motion.img
                src={heroImages[currentImageIndex]}
                alt="Church Background"
                className="absolute inset-0 w-full h-full object-cover filter blur-[1px] scale-105"
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                transition={{ 
                  duration: 1.5,
                  ease: "easeOut"
                }}
              />
              {/* Foreground sharp image */}
              <motion.img
                src={heroImages[currentImageIndex]}
                alt="Church Background"
                className="relative w-full h-full object-cover"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 1.2,
                  ease: "easeOut"
                }}
              />
              {/* Dark overlay with blur for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-[0.5px]" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Carousel Controls */}
        <motion.button
          onClick={() => paginate(-1)}
          className="absolute left-4 z-10 p-4 rounded-full bg-gray-900/30 hover:bg-gray-900/60 text-white transition-all duration-300"
          whileHover={{ 
            scale: 1.1,
            backgroundColor: "rgba(17, 24, 39, 0.6)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17
          }}
        >
          <ChevronLeftIcon className="h-8 w-8" />
        </motion.button>
        <motion.button
          onClick={() => paginate(1)}
          className="absolute right-4 z-10 p-4 rounded-full bg-gray-900/30 hover:bg-gray-900/60 text-white transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRightIcon className="h-8 w-8" />
        </motion.button>

        {/* Enhanced Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {heroImages.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentImageIndex(index);
                  setTimeout(() => setIsTransitioning(false), 1000);
                }
              }}
              className={`h-3 rounded-full transition-all duration-500 ${
                index === currentImageIndex 
                  ? 'w-12 bg-white' 
                  : 'w-3 bg-white/50 hover:bg-white/75'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
            />
          ))}
        </div>

        {/* Hero Content with Enhanced Animations */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1,
              ease: "easeOut",
              staggerChildren: 0.2
            }}
            className="text-center text-white"
          >
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="block">BIGOCA</span>
              <span className="block text-primary-300">
                Latter House of Glory
              </span>
            </motion.h1>
            <motion.p
              className="mt-6 max-w-lg mx-auto text-xl sm:text-2xl text-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Streamline your church's financial operations with our comprehensive management system.
            </motion.p>
            <motion.div
              className="mt-10 flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link
                to="/login"
                className="px-8 py-4 text-lg font-semibold rounded-full bg-white text-primary-600 hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-8 py-4 text-lg font-semibold rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Powerful Features
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Everything you need to manage your church finances efficiently
            </motion.p>
          </motion.div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    y: -10,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 17
                    }
                  }}
                  className="relative group"
                >
                  <div className="absolute -inset-2 rounded-lg bg-gradient-to-r from-primary-400 to-primary-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                  <div className="relative h-full bg-gray-900 rounded-lg p-8 shadow-lg transform transition-all duration-300 group-hover:shadow-2xl border border-gray-800">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-primary-400 to-primary-300 text-white mx-auto">
                      <feature.icon className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white text-center">
                      {feature.name}
                    </h3>
                    <p className="mt-4 text-gray-300 text-center">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-primary-300 hover:text-primary-200 font-medium inline-flex items-center"
                      >
                        Learn more
                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-16 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                About Our Mission
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500 dark:text-gray-400">
                We are dedicated to helping churches manage their finances efficiently and transparently.
                Our system is designed to streamline administrative tasks, allowing church leaders to focus
                more on their ministry and less on paperwork.
              </p>
              <div className="mt-8 sm:flex">
                <div className="rounded-md shadow">
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:mt-0 lg:grid-cols-2">
              <div className="col-span-1 flex justify-center py-8 px-8 bg-white/60 dark:bg-gray-800/60">
                <img
                  className="max-h-12"
                  src="/images/church-5.jpg"
                  alt="Mission"
                />
              </div>
              <div className="col-span-1 flex justify-center py-8 px-8 bg-white/60 dark:bg-gray-800/60">
                <img
                  className="max-h-12"
                  src="/images/church-6.jpg"
                  alt="Vision"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gradient-to-b from-gray-800/60 to-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              What Church Leaders Say
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
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
                transition={{ 
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  y: -10,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 17
                  }
                }}
                className="relative group"
              >
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
                <div className="relative bg-gray-900 p-8 rounded-2xl shadow-lg transform transition-all duration-300 group-hover:shadow-2xl border border-gray-800">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-r from-primary-400 to-primary-300 p-1">
                      <div className="h-full w-full rounded-full overflow-hidden">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {testimonial.name}
                      </h3>
                      <p className="text-primary-300">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <svg className="h-8 w-8 text-primary-300" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                    <p className="mt-4 text-lg text-gray-300 italic">
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
      <div id="contact" className="py-24 bg-gray-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Get in Touch
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Have questions? We're here to help you get started.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 rounded-2xl shadow-lg p-8"
            >
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-900 text-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-900 text-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-900 text-white shadow-sm focus:border-primary-400 focus:ring-primary-400"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-400 to-primary-300 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
                >
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 gap-8"
            >
              {[
                { 
                  icon: EnvelopeIcon, 
                  title: 'Email', 
                  content: 'bigocalhg@gmail.com', 
                  href: 'mailto:bigocalhg@gmail.com' 
                },
                { 
                  icon: PhoneIcon, 
                  title: 'Phone / WhatsApp', 
                  content: '+260 975 349 663',
                  href: 'tel:+260975349663',
                  whatsapp: 'https://wa.me/260975349663',
                  hasWhatsApp: true
                },
                { 
                  icon: MapPinIcon, 
                  title: 'Location', 
                  content: 'NYACHIMIKO EVENT CENTER', 
                  subContent: 'View on Google Maps',
                  href: 'https://maps.app.goo.gl/4qiw1X4N5YCRuQXC7' 
                }
              ].map((item, index) => (
                <div key={item.title} className="flex items-center p-6 bg-gray-900 rounded-xl shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-6 flex-grow">
                    <div className="text-lg font-medium text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {item.title}
                    </div>
                    <div className="mt-1 text-gray-500 dark:text-gray-400">
                      {item.content}
                    </div>
                    {item.subContent && (
                      <div className="mt-1 text-sm text-primary-400 hover:text-primary-300">
                        {item.subContent}
                      </div>
                    )}
                  </div>
                  {item.hasWhatsApp && (
                    <motion.a
                      href={item.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 rounded-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </motion.a>
                    )}
                  </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 backdrop-blur-sm border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start">
              <img
                className="h-12 w-auto mb-4"
                src="/logo (2).png"
                alt="BIGOCA Logo"
              />
              <p className="text-gray-400 text-center md:text-left">
                Empowering churches with modern financial management solutions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Features</h3>
                <ul className="mt-4 space-y-4">
                  {features.map(feature => (
                    <li key={feature.name}>
                      <a href="#features" className="text-base text-gray-400 hover:text-primary-300 transition-colors duration-200">
                        {feature.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Support</h3>
                <ul className="mt-4 space-y-4">
                  {['Documentation', 'Guides', 'API Status', 'Contact'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-base text-gray-400 hover:text-primary-300 transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Subscribe to our newsletter</h3>
              <div className="flex w-full max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-4 py-2 text-base text-white placeholder-gray-500 bg-gray-900 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-r-lg text-white bg-gradient-to-r from-primary-400 to-primary-300 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col items-center">
            <p className="text-base text-gray-400">
              © 2024 BIGOCA. All rights reserved.
            </p>
            <div className="mt-4 flex space-x-6">
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-gray-400 hover:text-primary-300 transition-colors duration-200"
                >
                  <span className="sr-only">{social}</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 