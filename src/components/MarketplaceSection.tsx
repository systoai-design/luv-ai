import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, User, MessageCircle, Clock, Coins } from "lucide-react";

const listings = [
  {
    id: 1,
    type: "ai",
    name: "Luna AI",
    description: "Your empathetic companion for late-night conversations",
    price: "0.01 SOL per message",
    category: "Companion",
    rating: 4.8,
    chats: 15420,
  },
  {
    id: 2,
    type: "human",
    name: "Jason",
    description: "Life coach & motivational speaker. Let's talk goals!",
    price: "0.5 SOL / 30 min",
    category: "Coaching",
    rating: 4.9,
    chats: 892,
  },
  {
    id: 3,
    type: "ai",
    name: "TechGuru AI",
    description: "Get instant answers to all your tech questions",
    price: "0.005 SOL per message",
    category: "Tech Support",
    rating: 4.7,
    chats: 28340,
  },
  {
    id: 4,
    type: "human",
    name: "Emma",
    description: "Relationship advisor with 10+ years experience",
    price: "0.8 SOL / 30 min",
    category: "Counseling",
    rating: 5.0,
    chats: 1523,
  },
];

const MarketplaceSection = () => {
  return (
    <section id="marketplace" className="py-24 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            AI & Human{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Marketplace
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Pay-per-message AI or timed sessions with verified humans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Card 
              key={listing.id} 
              className="bg-card border-border hover:border-primary/50 transition-all shadow-card hover:shadow-glow"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant={listing.type === "ai" ? "default" : "secondary"}
                    className={listing.type === "ai" ? "bg-primary" : "bg-accent"}
                  >
                    {listing.type === "ai" ? (
                      <>
                        <Bot className="h-3 w-3 mr-1" />
                        AI Bot
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        Human
                      </>
                    )}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    ⭐ {listing.rating}
                  </div>
                </div>
                <CardTitle className="text-xl">{listing.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{listing.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{listing.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{listing.chats.toLocaleString()} conversations</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;
