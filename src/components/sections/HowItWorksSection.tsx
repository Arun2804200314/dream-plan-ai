import { ClipboardList, Cpu, Eye, Download } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Input Requirements",
    description: "Enter your plot dimensions, number of rooms, floors, and design preferences through our intuitive form."
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Processing",
    description: "Our AI analyzes your requirements, applies architectural rules, and generates optimized layouts."
  },
  {
    icon: Eye,
    step: "03",
    title: "Review Options",
    description: "Browse multiple layout variations, compare designs, and select the best fit for your needs."
  },
  {
    icon: Download,
    step: "04",
    title: "Download & Build",
    description: "Export your finalized plan in your preferred format and start your construction project."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From requirements to ready-to-build plans in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card border border-border p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
