import { useState } from 'react';
import { ArrowLeft, Check, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

      if (!stripeKey) {
        setError(
          'Stripe is not configured. This is a demo - in production, you would be redirected to Stripe Checkout.'
        );
        setLoading(false);
        return;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_premium_monthly',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a href="#/settings" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Settings
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Upgrade to Premium for unlimited access to all features
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="text-gray-600">Perfect for trying out Aware</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Up to 3 courses</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">3 AI scans per month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic grade calculator</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">What-If scenarios</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">CSV export</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg border-2 border-blue-600 p-8 text-white relative">
            <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Premium</h2>
              <div className="mb-4">
                <span className="text-5xl font-bold">$9.99</span>
                <span className="text-blue-100 ml-2">/month</span>
              </div>
              <p className="text-blue-100">Everything you need to succeed</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>Unlimited courses</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>Unlimited AI scans</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>Advanced AI insights & predictions</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>PDF export with custom branding</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-100 mr-3 flex-shrink-0 mt-0.5" />
                <span>Early access to new features</span>
              </li>
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade to Premium'
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day money-back guarantee
          </p>
          <p className="text-sm text-gray-500">
            Prices in USD. Billed monthly. Cancel anytime.
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time from your settings page. You'll
                continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) via Stripe,
                our secure payment processor.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a student discount?
              </h3>
              <p className="text-gray-600">
                Yes! Contact us with your student email for a 50% discount on Premium plans.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
