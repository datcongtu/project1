import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Camera, Brain, MessageSquare, TrendingUp, Calendar } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mom-pink-light to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center">
              <Heart className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-mom-pink">MOMazing</h1>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Embrace Your <span className="text-mom-pink">New You</span>
          </h2>
          
          <p className="text-xl text-mom-gray mb-8 max-w-2xl mx-auto">
            Your comprehensive postpartum health platform with AI-powered exercise guidance, 
            psychological wellness support, and personalized care.
          </p>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-mom-pink hover:bg-mom-pink-accent text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Start Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-mom-pink-light rounded-lg flex items-center justify-center mb-4">
                <Camera className="text-mom-pink w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-Time Exercise Guidance
              </h3>
              <p className="text-mom-gray">
                Computer vision technology analyzes your posture and provides instant feedback 
                for safe, effective postpartum exercises.
              </p>
            </CardContent>
          </Card>

          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mental Wellness Support
              </h3>
              <p className="text-mom-gray">
                Psychological assessment tools, mood tracking, and therapy resources 
                to support your mental health journey.
              </p>
            </CardContent>
          </Card>

          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Assistant
              </h3>
              <p className="text-mom-gray">
                24/7 personalized chatbot support for guidance, motivation, 
                and answers to your postpartum questions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-mom-pink-light rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-mom-pink w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Progress Tracking
              </h3>
              <p className="text-mom-gray">
                Monitor your recovery journey with detailed analytics, 
                goal setting, and milestone celebrations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="text-orange-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Healthcare Integration
              </h3>
              <p className="text-mom-gray">
                Easy appointment scheduling with healthcare providers 
                and seamless care coordination.
              </p>
            </CardContent>
          </Card>

          <Card className="border-mom-pink-light hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personalized Care
              </h3>
              <p className="text-mom-gray">
                Customized exercise plans, nutrition guidance, and wellness 
                recommendations based on your unique needs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-mom-pink-light">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Postpartum Journey?
          </h3>
          <p className="text-xl text-mom-gray mb-8">
            Join thousands of mothers who have embraced their new selves with MOMazing.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-mom-pink hover:bg-mom-pink-accent text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}
