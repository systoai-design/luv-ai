import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Shield, Send } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const messages = [
  { id: 1, sender: "other", text: "Hey! How's your day going?", time: "2:34 PM" },
  { id: 2, sender: "me", text: "Great! Just working on some exciting projects 🚀", time: "2:35 PM" },
  { id: 3, sender: "other", text: "That sounds amazing! Tell me more about it", time: "2:36 PM" },
];

const ChatDemo = () => {
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={elementRef as React.RefObject<HTMLElement>}
      className={cn(
        "py-24 px-4 transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div 
          className={cn(
            "text-center mb-12 transition-all duration-700 delay-150",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Secure
            </span>{" "}
            & Private Chats
          </h2>
          <p className="text-xl text-muted-foreground">
            End-to-end encrypted conversations with x402 micropayments
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Card 
            className={cn(
              "bg-card border-border shadow-card transition-all duration-700 delay-300",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            )}
          >
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Sarah
                      <Badge className="bg-verified text-verified-foreground">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      E2EE enabled
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/50">
                  Active
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              <div className="h-96 space-y-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender === "me"
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  className="flex-1 bg-muted border-border"
                />
                <Button size="icon" className="bg-gradient-primary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div 
            className={cn(
              "space-y-6 transition-all duration-700 delay-500",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            )}
          >
            <Card className="bg-card/50 border-primary/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  End-to-End Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All messages are encrypted on your device before being sent. 
                  Only you and your chat partner can read them.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-accent/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  x402 Micropayments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pay only for what you use - per message for AI or by time for humans. 
                  Instant payments via your connected wallet.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-secondary/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary" />
                  Verified Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get verified with KYC to earn the red checkmark badge. 
                  Build trust and unlock premium features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemo;
