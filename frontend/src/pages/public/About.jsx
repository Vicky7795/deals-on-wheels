import React from 'react';
import { Car, ShieldCheck, Users, Search, ShoppingBag } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg">
          <Car className="w-9 h-9" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">About Deals on Wheels</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Deals on Wheels is a modern vehicle marketplace that connects buyers and sellers in one easy-to-use platform.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">Our Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Easy Vehicle Discovery</h3>
              <p className="text-sm text-gray-500 mt-1">Real-time search across categories, brands, price ranges, fuel types, and cities.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Direct Seller Communication</h3>
              <p className="text-sm text-gray-500 mt-1">Inquiry messaging system allowing buyers to interact directly with vehicle owners.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Seamless Buying Process</h3>
              <p className="text-sm text-gray-500 mt-1">Atomic order confirmation flow preventing double purchases and ensuring inventory accuracy.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Seller Vehicle Management</h3>
              <p className="text-sm text-gray-500 mt-1">Full control for sellers to add, edit, delete, and mark vehicle listings as sold.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
