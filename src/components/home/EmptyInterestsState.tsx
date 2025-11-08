import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmptyInterestsStateProps {
  variant?: "feed" | "sidebar";
  userId: string;
}

export const EmptyInterestsState = ({ variant = "feed", userId }: EmptyInterestsStateProps) => {
  const navigate = useNavigate();

  const handleAddInterests = () => {
    navigate('/profile');
  };

  if (variant === "sidebar") {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4 text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <div>
            <p className="text-sm font-medium">Add interests to discover like-minded people!</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddInterests}
            className="w-full"
          >
            Add Interests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/50 shadow-card">
      <CardContent className="p-8 text-center space-y-6">
        <div className="space-y-3">
          <Sparkles className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-2xl font-semibold">Personalize Your Feed</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add interests to your profile to see posts from like-minded people and discover content tailored just for you
          </p>
        </div>

        <div className="space-y-2 max-w-sm mx-auto text-left">
          {[
            "Discover content that matches your interests",
            "Connect with people who share your passions",
            "Get personalized recommendations"
          ].map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <Button 
          size="lg" 
          onClick={handleAddInterests}
          className="mt-4"
        >
          Add Interests Now
        </Button>
      </CardContent>
    </Card>
  );
};
