import { 
  Brain, 
  Ruler, 
  Shield, 
  Zap, 
  Layout, 
  Download,
  Sparkles,
  Settings
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Design",
    description: "Advanced machine learning models trained on thousands of architectural plans for optimal layouts."
  },
  {
    icon: Ruler,
    title: "Custom Dimensions",
    description: "Input your exact plot size and room requirements for perfectly scaled floor plans."
  },
  {
    icon: Shield,
    title: "Compliance Ready",
    description: "Automatic validation against building codes, safety standards, and ventilation requirements."
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Get multiple layout options in seconds, not days. Iterate and refine in real-time."
  },
  {
    icon: Layout,
    title: "2D & 3D Views",
    description: "Visualize your plans in professional blueprint style or interactive 3D models."
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Download your plans in high-resolution images, PDF, or CAD-compatible formats."
  },
  {
    icon: Sparkles,
    title: "Style Preferences",
    description: "Choose from modern, traditional, or custom design styles to match your vision."
  },
  {
    icon: Settings,
    title: "Space Optimization",
    description: "Intelligent algorithms maximize usable space while maintaining functional flow."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Smart Design
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional building plans without the complexity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
